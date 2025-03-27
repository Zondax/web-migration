import { getApiAndProvider, getBalance } from '@/lib/account';
import { convertSS58Format } from '@/lib/addresses';
import { handleLedgerError } from '@/lib/utils';
import { observable } from '@legendapp/state';
import { AppConfig, AppId, appsConfigs, polkadotAppConfig } from 'config/apps';
import { errorDetails, InternalErrors } from 'config/errors';
import { LedgerClientError } from './client/base';
import { ledgerClient } from './client/ledger';
import { notifications$ } from './notifications';
import {
  Address,
  DeviceConnectionProps,
  UpdateMigratedStatusFn
} from './types/ledger';

export type AppStatus = 'migrated' | 'synchronized' | 'loading' | 'error';

export type AppIcons = {
  [key in AppId]: string;
};

export interface App {
  name: string;
  id: AppId;
  accounts?: Address[];
  ticker: string;
  decimals: number;
  status?: AppStatus;
  error?: {
    source: 'synchronization';
    description: string;
  };
}

interface LedgerState {
  device: {
    connection?: DeviceConnectionProps;
    isLoading: boolean;
    error?: string;
  };
  apps: {
    apps: App[];
    polkadotApp: App;
    status?: AppStatus;
    error?: string;
    syncProgress: number;
  };
  polkadotAddresses: Partial<Record<AppId, string[]>>;
}

const initialLedgerState: LedgerState = {
  device: {
    connection: undefined,
    isLoading: false,
    error: undefined
  },
  apps: {
    apps: [],
    polkadotApp: polkadotAppConfig,
    status: undefined,
    error: undefined,
    syncProgress: 0
  },
  polkadotAddresses: {}
};

// Update App
function updateApp(appId: AppId, update: Partial<App>) {
  const apps = ledgerState$.apps.apps.get();
  const appIndex = apps.findIndex((app) => app.id === appId);

  if (appIndex !== -1) {
    const updatedApp = { ...apps[appIndex], ...update };
    ledgerState$.apps.apps[appIndex].set(updatedApp);
  } else {
    console.warn(`App with id ${appId} not found for UI update.`);
  }
}

// Update Account
function updateAccount(
  appId: AppId,
  address: string,
  update: Partial<Address>
) {
  const apps = ledgerState$.apps.apps.get();
  const appIndex = apps.findIndex((app) => app.id === appId);

  if (appIndex !== -1) {
    const accounts = apps[appIndex]?.accounts
      ? [...apps[appIndex].accounts]
      : [];
    const accountIndex = accounts.findIndex(
      (account) => account.address === address
    );

    if (accountIndex !== -1) {
      const updatedAccount = { ...accounts[accountIndex], ...update };
      accounts[accountIndex] = updatedAccount;
      ledgerState$.apps.apps[appIndex].accounts.set(accounts);
    } else {
      console.warn(
        `Account with address ${address} not found in app ${appId} for UI update.`
      );
    }
  } else {
    console.warn(`App with appId ${appId} not found for account UI update.`);
  }
}

// Update Migrated Status
const updateMigratedStatus: UpdateMigratedStatusFn = (
  appId: AppId,
  accountPath: string,
  status,
  message,
  txDetails
) => {
  const apps = ledgerState$.apps.apps.get();
  const appIndex = apps.findIndex((app) => app.id === appId);

  if (appIndex !== -1) {
    const accounts = apps[appIndex]?.accounts
      ? [...apps[appIndex].accounts]
      : [];

    const accountIndex = accounts.findIndex(
      (account) => account.path === accountPath
    );

    if (accounts[accountIndex]) {
      // Update the account's transaction details
      accounts[accountIndex] = {
        ...accounts[accountIndex],
        transaction: {
          status: status,
          statusMessage: message,
          hash: txDetails?.txHash,
          blockHash: txDetails?.blockHash,
          blockNumber: txDetails?.blockNumber
        },
        isLoading:
          status === 'pending' || status === 'inBlock' || status === 'finalized'
      };
      ledgerState$.apps.apps[appIndex].accounts.set(accounts);
    }
  }
};

export const ledgerState$ = observable({
  ...initialLedgerState,
  async connectLedger() {
    // Set the loading state to true and clear any previous errors
    ledgerState$.device.isLoading.set(true);
    ledgerState$.device.error.set(undefined);

    try {
      const response = await ledgerClient.connectDevice();

      ledgerState$.device.connection.set(response?.connection);
      ledgerState$.device.error.set(response?.error); // Set error even if not connected
      return { connected: Boolean(response?.connection && !response?.error) };
    } catch (error) {
      handleLedgerError(
        error as LedgerClientError,
        InternalErrors.CONNECTION_ERROR
      );
      return { connected: false };
    } finally {
      ledgerState$.device.isLoading.set(false);
    }
  },

  disconnectLedger() {
    try {
      ledgerClient.disconnect();
      ledgerState$.device.connection.set(undefined);
    } catch (error) {
      handleLedgerError(
        error as LedgerClientError,
        InternalErrors.DISCONNECTION_ERROR
      );
    }
  },

  // Synchronize Single Account
  async synchronizeAccount(appId: AppId) {
    updateApp(appId, { status: 'loading' });

    const app = appsConfigs.get(appId);
    if (!app) {
      console.error(`App with id ${appId} not found.`);
      return;
    }

    try {
      const response = await ledgerClient.synchronizeAccounts(app);

      updateApp(appId, { accounts: response.result, status: 'synchronized' });
    } catch (error) {
      updateApp(appId, { status: 'error' });
      ledgerState$.apps.error.set('Failed to synchronize accounts');
    }
  },

  // Fetch and Process Accounts for a Single App
  async fetchAndProcessAccountsForApp(
    app: AppConfig,
    filterByBalance: boolean = true
  ): Promise<App | undefined> {
    try {
      const response = await ledgerClient.synchronizeAccounts(app);

      if (!response.result || !app.rpcEndpoint) {
        return {
          name: app.name,
          id: app.id,
          ticker: app.ticker,
          decimals: app.decimals,
          status: 'error'
        };
      }

      const polkadotAccounts =
        ledgerState$.apps.polkadotApp.get().accounts || [];

      const { api, provider, error } = await getApiAndProvider(app.rpcEndpoint);

      if (error || !api) {
        return {
          name: app.name,
          id: app.id,
          ticker: app.ticker,
          decimals: app.decimals,
          status: 'error',
          error: {
            source: 'synchronization',
            description:
              errorDetails.blockchain_connection_error.description ?? ''
          }
        };
      }

      const accounts: Address[] = await Promise.all(
        response.result.map(async (address) => {
          return await getBalance(address, api);
        })
      );

      const filteredAccounts = accounts.filter(
        (account) =>
          !filterByBalance ||
          (account.balance && account.balance > 0) ||
          account.error
      );

      // Only set the app if there are accounts after filtering
      if (filteredAccounts.length > 0) {
        const polkadotAddresses = polkadotAccounts.map((account) =>
          convertSS58Format(account.address, app.ss58Prefix || 0)
        );

        ledgerState$.polkadotAddresses[app.id].set(polkadotAddresses);

        return {
          name: app.name,
          id: app.id,
          ticker: app.ticker,
          decimals: app.decimals,
          status: 'synchronized',
          accounts: filteredAccounts.map((account) => ({
            ...account,
            destinationAddress: polkadotAddresses[0]
          }))
        };
      } else {
        notifications$.push({
          title: `No funds found`,
          description: `No accounts with balance to migrate for ${app.id.charAt(0).toUpperCase() + app.id.slice(1)}`,
          appId: app.id,
          type: 'info',
          autoHideDuration: 5000
        });
      }

      if (api) {
        await api.disconnect();
      } else if (provider) {
        await provider.disconnect();
      }

      return undefined; // No accounts after filtering
    } catch (error) {
      console.log('Error fetching and processing accounts for app:', app.id);
      return {
        name: app.name,
        id: app.id,
        ticker: app.ticker,
        decimals: app.decimals,
        status: 'error'
      };
    }
  },

  // Synchronize Accounts
  async synchronizeAccounts() {
    ledgerState$.apps.assign({ status: 'loading', apps: [], syncProgress: 0 });

    try {
      const connection = ledgerState$.device.connection.get();
      if (!connection) {
        ledgerState$.apps.assign({
          status: undefined,
          apps: [],
          syncProgress: 0
        });
        return;
      }

      const polkadotApp = await ledgerState$.fetchAndProcessAccountsForApp(
        polkadotAppConfig,
        false
      );
      if (polkadotApp) {
        ledgerState$.apps.polkadotApp.set({
          ...polkadotApp,
          status: 'synchronized'
        });
      }

      // Get the total number of apps to synchronize
      const appsToSync = Array.from(appsConfigs.values()).filter(
        (appConfig) => appConfig && appConfig.rpcEndpoint
      );
      const totalApps = appsToSync.length;
      let syncedApps = 0;

      // request and save the accounts of each app synchronously
      for (const appConfig of appsToSync) {
        const app = await ledgerState$.fetchAndProcessAccountsForApp(appConfig);
        if (app) {
          ledgerState$.apps.apps.push(app);
        }

        // Update sync progress
        syncedApps++;
        const progress = Math.round((syncedApps / totalApps) * 100);
        ledgerState$.apps.syncProgress.set(progress);
      }

      ledgerState$.apps.status.set('synchronized');
    } catch (error) {
      handleLedgerError(error as LedgerClientError, InternalErrors.SYNC_ERROR);
      ledgerState$.apps.error.set('Failed to synchronize accounts');
    }
  },

  // Synchronize Balance
  async getAccountBalance(appId: AppId, address: Address) {
    updateAccount(appId, address.address, { isLoading: true });
    const rpcEndpoint = appsConfigs.get(appId)?.rpcEndpoint;

    if (!rpcEndpoint) {
      console.error('RPC endpoint not found for app:', appId);
      updateAccount(appId, address.address, {
        isLoading: false,
        error: {
          source: 'balance_fetch',
          description: 'RPC endpoint not found'
        }
      });
      return;
    }

    const { api, provider, error } = await getApiAndProvider(rpcEndpoint);

    if (error || !api) {
      updateAccount(appId, address.address, {
        isLoading: false,
        error: {
          source: 'balance_fetch',
          description: errorDetails.balance_not_gotten.description ?? ''
        }
      });
      return;
    }

    try {
      const accountWithBalance = await getBalance(address, api);
      updateAccount(appId, address.address, {
        ...accountWithBalance,
        isLoading: false
      });
    } catch (error) {
      handleLedgerError(
        error as LedgerClientError,
        InternalErrors.BALANCE_NOT_GOTTEN
      );
      updateAccount(appId, address.address, {
        isLoading: false,
        error: {
          source: 'balance_fetch',
          description: 'Failed to fetch balance'
        }
      });
    } finally {
      if (api) {
        await api.disconnect();
      } else if (provider) {
        await provider.disconnect();
      }
    }
  },

  // Migrate Single Account
  async migrateAccount(appId: AppId, accountIndex: number) {
    const apps = ledgerState$.apps.apps.get();
    const app = apps.find((app) => app.id === appId);
    const account = app?.accounts?.[accountIndex];

    console.log(
      `Starting migration for account at index ${accountIndex} in app ${appId}`
    );
    if (!account) {
      console.warn(
        `Account at index ${accountIndex} not found in app ${appId} for migration.`
      );
      return;
    }

    updateAccount(appId, account.address, {
      isLoading: true,
      error: undefined
    });

    try {
      const response = await ledgerClient.migrateAccount(
        appId,
        account,
        updateMigratedStatus
      );

      if (!response.migrated) {
        updateAccount(appId, account.address, {
          error: {
            source: 'migration',
            description: InternalErrors.MIGRATION_ERROR
          },
          isLoading: false
        });
        console.log(
          `Account at path ${account.path} in app ${appId} migration failed:`,
          InternalErrors.MIGRATION_ERROR
        );
      } else if (response.migrated) {
        updateAccount(appId, account.address, {
          status: 'migrated',
          isLoading: false
        });

        console.log(
          `Account at index ${accountIndex} in app ${appId} migrated successfully`
        );
      } else {
        updateAccount(appId, account.address, { isLoading: false }); // Reset loading
      }
    } catch (error) {
      updateAccount(appId, account.address, {
        error: {
          source: 'migration',
          description:
            (error as LedgerClientError).message || 'Failed to migrate account'
        },
        isLoading: false
      });
    }
  },

  // Migrate All Accounts within a Single App
  async migrateAppAccounts(app: App) {
    if (!app.accounts || app.accounts.length === 0) return;

    // Set app status to loading before starting migration
    updateApp(app.id, { status: 'loading' });

    try {
      // Migrate each account in the app
      for (
        let accountIndex = 0;
        accountIndex < app.accounts.length;
        accountIndex++
      ) {
        const account = app.accounts[accountIndex];

        // Skip accounts that are already migrated or have no balance
        if (
          account.status === 'migrated' ||
          !account.balance ||
          account.balance <= 0
        ) {
          continue;
        }
        await ledgerState$.migrateAccount(app.id, accountIndex);
      }
    } catch (error) {
      handleLedgerError(
        error as LedgerClientError,
        InternalErrors.MIGRATION_ERROR
      );
    } finally {
      updateApp(app.id, { status: 'synchronized' });
    }
  },

  // Migrate All Accounts (refactored)
  async migrateAll() {
    try {
      const apps = ledgerState$.apps.apps.get();
      for (const app of apps) {
        await ledgerState$.migrateAppAccounts(app);
      }
    } catch (error) {
      handleLedgerError(
        error as LedgerClientError,
        InternalErrors.MIGRATION_ERROR
      );
      ledgerState$.apps.error.set('Failed to complete migration');
    }
  }
});
