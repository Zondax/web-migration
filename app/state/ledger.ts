import { getBalance } from '@/lib/account';
import { handleLedgerError } from '@/lib/utils';
import { observable } from '@legendapp/state';
import {
  AppConfig,
  AppIds,
  appsConfigs,
  polkadotAppConfig
} from 'app/config/apps';
import { InternalErrors } from 'app/config/errors';
import { LedgerClientError } from './client/base';
import { ledgerClient } from './client/ledger';
import {
  Address,
  DeviceConnectionProps,
  UpdateMigratedStatusFn
} from './types/ledger';

export type AppStatus = 'migrated' | 'synchronized' | 'loading' | 'error';

export type AppIcons = {
  [key in AppIds]: string;
};

export interface App {
  name: string;
  id: AppIds;
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
  };
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
    error: undefined
  }
};

let iconsStatus: 'loading' | 'loaded' | 'unloaded' = 'unloaded';

// Update App
function updateApp(appId: AppIds, update: Partial<App>) {
  const apps = ledgerState$.apps.apps.get();
  const appIndex = apps.findIndex((app) => app.id === appId);

  if (appIndex !== -1) {
    const updatedApp = { ...apps[appIndex], ...update };
    ledgerState$.apps.apps[appIndex].set(updatedApp);
  } else {
    console.warn(`App with id ${appId} not found for UI update.`);
    // Consider throwing an error, or handling this case more explicitly
  }
}

// Update Account
function updateAccount(
  appId: AppIds,
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
  appId: AppIds,
  accountIndex: number,
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
      console.log(
        'response',
        response,
        response?.connection && !response?.error
      );
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
  async synchronizeAccount(appId: AppIds) {
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

      const accounts: Address[] = await Promise.all(
        response.result.map(async (address, index) => {
          const accountWithBalance = await getBalance(
            address,
            app.rpcEndpoint!
          );

          // Set corresponding Polkadot address at same index if it exists
          if (polkadotAccounts[index]) {
            accountWithBalance.destinationAddress = polkadotAccounts[index]
              ? polkadotAccounts[index].address
              : polkadotAccounts[0].address;
          }

          return accountWithBalance;
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
        return {
          name: app.name,
          id: app.id,
          ticker: app.ticker,
          decimals: app.decimals,
          status: 'synchronized',
          accounts: filteredAccounts
        };
      }
      return undefined; // No accounts after filtering
    } catch (error) {
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
    ledgerState$.apps.assign({ status: 'loading', apps: [] });

    try {
      const connection = ledgerState$.device.connection.get();
      if (!connection) {
        ledgerState$.apps.assign({ status: undefined, apps: [] });
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

      // request and save the accounts of each app synchronously
      // TODO: Change to Array.from(appsConfigs.values()) when the web is ready
      for (const appConfig of [
        appsConfigs.get(AppIds.ASTAR),
        appsConfigs.get(AppIds.POLKADOT),
        appsConfigs.get(AppIds.KUSAMA),
        appsConfigs.get(AppIds.EQUILIBRIUM),
        appsConfigs.get(AppIds.NODLE)
      ]) {
        // Skip apps that do not have an rpcEndpoint defined
        if (!appConfig || !appConfig.rpcEndpoint) continue;
        const app = await ledgerState$.fetchAndProcessAccountsForApp(appConfig);
        if (app) {
          ledgerState$.apps.apps.push(app);
        }
      }

      ledgerState$.apps.status.set('synchronized');
    } catch (error) {
      handleLedgerError(error as LedgerClientError, InternalErrors.SYNC_ERROR);
      ledgerState$.apps.error.set('Failed to synchronize accounts');
    }
  },

  // Synchronize Balance
  async getAccountBalance(appId: AppIds, address: Address) {
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

    try {
      const accountWithBalance = await getBalance(address, rpcEndpoint);
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
    }
  },

  // Migrate Single Account
  async migrateAccount(appId: AppIds, accountIndex: number) {
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

    updateAccount(appId, account.address, { isLoading: true });

    try {
      const response = await ledgerClient.migrateAccount(
        appId,
        account,
        accountIndex,
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
          `Account at index ${accountIndex} in app ${appId} migration failed:`,
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
    ledgerState$.apps.apps
      .find((a) => a.id.get() === app.id)
      ?.status.set('loading');

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
      ledgerState$.apps.apps
        .find((a) => a.id.get() === app.id)
        ?.status.set('synchronized');
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
