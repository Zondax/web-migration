import { getBalance } from '@/lib/account';
import { getAppLightIcon } from '@/lib/utils';
import { observable } from '@legendapp/state';
import {
  AppConfig,
  AppIds,
  appsConfigs,
  polkadotAppConfig
} from 'app/config/apps';
import { Address, TransactionStatus } from './types/ledger';
import { ledgerWalletState$ } from './wallet/ledger';

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

interface UIState {
  device: {
    isConnected: boolean;
    isLoading: boolean;
    error?: string;
    appVersion?: string;
  };
  apps: {
    apps: App[];
    polkadotApp: App;
    status?: AppStatus;
    error?: string;
    icons: Partial<{ [key in AppIds]: any }>;
  };
}

const initialUIState: UIState = {
  device: {
    isConnected: false,
    isLoading: false,
    error: undefined
  },
  apps: {
    apps: [],
    polkadotApp: polkadotAppConfig,
    status: undefined,
    error: undefined,
    icons: {}
  }
};

let iconsStatus: 'loading' | 'loaded' | 'unloaded' = 'unloaded';

// Update UI for Single App
function updateAppUI(appId: AppIds, update: Partial<App>) {
  const apps = uiState$.apps.apps.get();
  const appIndex = apps.findIndex((app) => app.id === appId);

  if (appIndex !== -1) {
    const updatedApp = { ...apps[appIndex], ...update };
    uiState$.apps.apps[appIndex].set(updatedApp);
  } else {
    console.warn(`App with id ${appId} not found for UI update.`);
    // Consider throwing an error, or handling this case more explicitly
  }
}

// Update Account UI
function updateAccountUI(
  appId: AppIds,
  address: string,
  update: Partial<Address>
) {
  const apps = uiState$.apps.apps.get();
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
      uiState$.apps.apps[appIndex].accounts.set(accounts);
    } else {
      console.warn(
        `Account with address ${address} not found in app ${appId} for UI update.`
      );
    }
  } else {
    console.warn(`App with appId ${appId} not found for account UI update.`);
  }
}

export const uiState$ = observable({
  ...initialUIState,
  async connectLedger() {
    // Set the loading state to true and clear any previous errors
    uiState$.device.isLoading.set(true);
    uiState$.device.error.set(undefined);

    try {
      const response = await ledgerWalletState$.connectDevice();
      uiState$.device.isConnected.set(!!response?.connected);
      uiState$.device.error.set(response?.error); // Set error even if not connected
      return { connected: response?.connected };
    } catch (error) {
      uiState$.device.error.set('Failed to connect to Ledger');
      return { connected: false };
    } finally {
      // Reset the loading state regardless of success or failure
      uiState$.device.isLoading.set(false);
    }
  },

  disconnectLedger() {
    ledgerWalletState$.disconnect();
    uiState$.device.isConnected.set(false);
  },

  // Synchronize Single Account
  async synchronizeAccount(appId: AppIds) {
    updateAppUI(appId, { status: 'loading' });

    const app = appsConfigs.get(appId);
    if (!app) {
      console.error(`App with id ${appId} not found.`);
      return;
    }

    try {
      const response = await ledgerWalletState$.synchronizeAccounts(app);

      if (response.error) {
        updateAppUI(appId, { status: 'error' });
        return;
      }

      updateAppUI(appId, { accounts: response.result, status: 'synchronized' });
    } catch (error) {
      console.error(`Failed to synchronize account for app ${appId}:`, error);
      updateAppUI(appId, { status: undefined }); // Keep loading state false on error
      uiState$.apps.error.set('Failed to synchronize accounts');
    }
  },

  // Fetch and Process Accounts for a Single App
  async fetchAndProcessAccountsForApp(
    app: AppConfig,
    filterByBalance: boolean = true
  ): Promise<App | undefined> {
    try {
      const response = await ledgerWalletState$.synchronizeAccounts(app);

      if (response.error || !response.result || !app.rpcEndpoint) {
        return {
          name: app.name,
          id: app.id,
          ticker: app.ticker,
          decimals: app.decimals,
          status: 'error'
        };
      }

      const polkadotAccounts = uiState$.apps.polkadotApp.get().accounts || [];

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
      console.error(
        `Failed to synchronize accounts for app ${app.name}:`,
        error
      );
      return {
        name: app.name,
        id: app.id,
        ticker: app.ticker,
        decimals: app.decimals,
        status: 'error'
      };
    }
  },

  // Synchronize Accounts (refactored)
  async synchronizeAccounts() {
    uiState$.apps.assign({ status: 'loading', apps: [] });

    try {
      const connection = ledgerWalletState$.deviceConnection.connection.get();
      if (!connection) {
        uiState$.apps.assign({ status: undefined, apps: [] });
        return;
      }

      const polkadotApp = await uiState$.fetchAndProcessAccountsForApp(
        polkadotAppConfig,
        false
      );
      if (polkadotApp) {
        uiState$.apps.polkadotApp.set({
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
        const app = await uiState$.fetchAndProcessAccountsForApp(appConfig);
        if (app) {
          uiState$.apps.apps.push(app);
        }
      }

      uiState$.apps.status.set('synchronized');
    } catch (error) {
      console.error('Failed to synchronize accounts:', error);
      uiState$.apps.error.set('Failed to synchronize accounts');
    }
  },

  // Synchronize Balance
  async synchronizeBalance(appId: AppIds, address: Address) {
    updateAccountUI(appId, address.address, { isLoading: true });
    const rpcEndpoint = appsConfigs.get(appId)?.rpcEndpoint;

    if (!rpcEndpoint) {
      console.error('RPC endpoint not found for app:', appId);
      updateAccountUI(appId, address.address, {
        isLoading: false,
        error: {
          source: 'balance_fetch',
          description: 'RPC endpoint not found'
        }
      }); // Set error
      return;
    }

    try {
      const accountWithBalance = await getBalance(address, rpcEndpoint);
      updateAccountUI(appId, address.address, {
        ...accountWithBalance,
        isLoading: false
      });
    } catch (error) {
      console.error(
        `Error synchronizing balance for account ${address} in app ${appId}:`,
        error
      );
      updateAccountUI(appId, address.address, {
        isLoading: false,
        error: {
          source: 'balance_fetch',
          description: 'Failed to fetch balance'
        }
      }); // Set a generic error
    }
  },

  async loadInitialIcons() {
    if (iconsStatus !== 'unloaded') return;
    iconsStatus = 'loading';

    const appIcons: Partial<AppIcons> = {};

    const iconPromises = Array.from(appsConfigs.values())
      .filter((app) => app.rpcEndpoint)
      .map(async (app: AppConfig) => {
        const lightIconResponse = await getAppLightIcon(app.id);
        if (typeof lightIconResponse?.error === 'undefined') {
          appIcons[app.id] = lightIconResponse?.data;
        }
      });

    await Promise.all(iconPromises);
    uiState$.apps.icons.set(appIcons);
    iconsStatus = 'loaded';
  },

  // Migrate Single Account (refactored)
  async migrateAccount(appId: AppIds, accountIndex: number) {
    const apps = uiState$.apps.apps.get();
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

    updateAccountUI(appId, account.address, { isLoading: true });

    const response = await ledgerWalletState$.migrateAccount(
      appId,
      account,
      accountIndex
    );

    if (response.error && !response.migrated) {
      updateAccountUI(appId, account.address, {
        error: { source: 'migration', description: response.error },
        isLoading: false
      });
      console.log(
        `Account at index ${accountIndex} in app ${appId} migration failed:`,
        response.error
      );
    } else if (response.migrated) {
      updateAccountUI(appId, account.address, {
        status: 'migrated',
        isLoading: false
      });

      console.log(
        `Account at index ${accountIndex} in app ${appId} migrated successfully`
      );
    } else {
      updateAccountUI(appId, account.address, { isLoading: false }); // Reset loading
    }
  },

  // Migrate All Accounts within a Single App
  async migrateAppAccounts(app: App) {
    if (!app.accounts || app.accounts.length === 0) return;

    // Set app status to loading before starting migration
    uiState$.apps.apps
      .find((a) => a.id.get() === app.id)
      ?.status.set('loading');

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
      await uiState$.migrateAccount(app.id, accountIndex);
    }
    uiState$.apps.apps
      .find((a) => a.id.get() === app.id)
      ?.status.set('synchronized');
  },

  // Migrate All Accounts (refactored)
  async migrateAll() {
    try {
      const apps = uiState$.apps.apps.get();
      for (const app of apps) {
        await uiState$.migrateAppAccounts(app);
      }
    } catch (error) {
      console.error('Failed to complete migration:', error);
      uiState$.apps.error.set('Failed to complete migration');
    }
  },

  // No changes needed
  migrateAccountSetStatus(
    appId: AppIds,
    accountIndex: number,
    status: TransactionStatus,
    message?: string,
    txDetails?: { txHash?: string; blockHash?: string; blockNumber?: string }
  ) {
    const apps = uiState$.apps.apps.get();
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
            status === 'pending' ||
            status === 'inBlock' ||
            status === 'finalized'
        };
        uiState$.apps.apps[appIndex].accounts.set(accounts);
      }
    }
  }
});
