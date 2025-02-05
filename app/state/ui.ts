import { getAppLightIcon, getBalance } from '@/lib/account';
import { observable } from '@legendapp/state';
import { GenericeResponseAddress } from '@zondax/ledger-substrate/dist/common';
import type { AppIds } from 'app/config/apps';
import { appsConfigs } from 'app/config/apps';
import { ledgerWalletState$ } from './wallet/ledger';

export type AddressStatus = 'synchronized' | 'migrated';

export interface Address extends GenericeResponseAddress {
  balance?: number;
  status?: AddressStatus;
  isLoading?: boolean;
  error?: {
    source: 'migration' | 'balance_fetch';
    description: string;
  };
}

export type AppStatus = 'synchronized' | 'loading' | 'error';

export type AppIcons = {
  [key in AppIds]: string;
};

export interface App {
  name: string;
  id: string;
  accounts?: Address[];
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
  };
  apps: {
    apps: App[];
    status?: AppStatus;
    error?: string;
    icons: { [key in AppIds]: any };
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
    status: undefined,
    error: undefined,
    icons: {}
  }
};

let iconsLoaded: boolean = false;

export const uiState$ = observable({
  ...initialUIState,
  async connectLedger() {
    // Set the loading state to true and clear any previous errors
    uiState$.device.isLoading.set(true);
    uiState$.device.error.set(undefined);

    try {
      const response = await ledgerWalletState$.connectDevice();

      if (!response?.connected) {
        uiState$.device.error.set(response?.error);
      } else {
        uiState$.device.isConnected.set(true);
      }

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
  async synchronizeAccount(appId: AppIds) {
    const apps = uiState$.apps.apps.get();
    const appIndex = apps.findIndex((app) => app.name === appId);

    if (appIndex !== -1) {
      // Create a copy of the app object to ensure immutability
      const updatedApp = { ...apps[appIndex], isLoading: true };
      uiState$.apps.apps[appIndex].set(updatedApp);

      try {
        const response = await ledgerWalletState$.synchronizeAccounts(
          appId.toUpperCase()
        );

        if (response.error) {
          uiState$.apps.apps[appIndex].set({
            ...updatedApp,
            status: undefined
          });
          return;
        }

        const updatedAccounts = response.result;
        uiState$.apps.apps[appIndex].set({
          ...updatedApp,
          accounts: updatedAccounts,
          status: 'synchronized'
        });
      } catch (error) {
        uiState$.apps.error.set('Failed to synchronize accounts');
        uiState$.apps.apps[appIndex].set({ ...updatedApp, status: undefined });
      }
    } else {
      uiState$.apps.error.set(`App with id ${appId} not found`);
    }
  },
  async synchronizeAccounts() {
    // reset the state, in case it was synchronized previously
    uiState$.apps.assign({ status: 'loading', apps: [] });

    try {
      // Check if the Ledger app is ready before proceeding
      const connection =
        await ledgerWalletState$.deviceConnection.connection.get();

      if (!connection) {
        uiState$.apps.assign({ status: undefined, apps: [] });
        return;
      }

      // TODO: BORRAR SLICE
      // request and save the accounts of each app synchronously
      for (const app of appsConfigs.slice(0, 10)) {
        const rpcEndpoint = app.rpcEndpoint;
        // Skip apps that do not have an rpcEndpoint defined
        if (!rpcEndpoint) {
          continue;
        }

        const response = await ledgerWalletState$.synchronizeAccounts(app.id);

        if (response.error) {
          uiState$.apps.apps.set([
            ...uiState$.apps.apps.get(),
            {
              name: app.name,
              id: app.id,
              status: 'error'
            }
          ]);
          continue;
        }

        // Fetch the balance for each address
        const accounts: Address[] = response.result
          ? await Promise.all(
              response.result.map(async (address) => {
                return await uiState$.fetchAccountBalance(address, rpcEndpoint);
              })
            )
          : [];

        // Filter out addresses with zero balance
        const filteredAccounts = accounts.filter(
          (account) => (account.balance && account.balance > 0) || account.error
        );

        // Only set the app if there are accounts with non-zero balance
        if (filteredAccounts.length > 0) {
          uiState$.apps.apps.set([
            ...uiState$.apps.apps.get(),
            {
              name: app.name,
              id: app.id,
              status: 'synchronized',
              accounts: filteredAccounts
            }
          ]);
        }
      }
      uiState$.apps.status.set('synchronized');
    } catch (error) {
      uiState$.apps.error.set('Failed to synchronize accounts');
    }
  },
  async fetchAccountBalance(
    address: GenericeResponseAddress,
    rpcEndpoint: string
  ): Promise<Address> {
    console.log(
      `Fetching balance for address: ${address.address} using RPC endpoint: ${rpcEndpoint}`
    );
    const balanceResult = await getBalance(address.address, rpcEndpoint);
    console.log(
      `Balance fetch result for address ${address.address}:`,
      balanceResult
    );

    return {
      ...address,
      balance: balanceResult.result,
      status: 'synchronized',
      error: balanceResult.error
        ? {
            source: 'balance_fetch',
            description: balanceResult.error
          }
        : undefined
    } as Address;
  },
  async synchronizeBalance(appId: AppIds, address: string) {
    console.log(
      `Synchronizing balance for appId: ${appId}, address: ${address}`
    );
    const apps = uiState$.apps.apps.get();
    const appIndex = apps.findIndex((app) => app.id === appId);

    if (appIndex !== -1) {
      console.log(`App found at index ${appIndex} for appId: ${appId}`);
      const accounts = apps[appIndex]?.accounts
        ? [...apps[appIndex].accounts]
        : [];

      const accountIndex = accounts.findIndex(
        (account) => account.address === address
      );

      if (accountIndex !== -1) {
        console.log(
          `Account found at index ${accountIndex} for address: ${address}`
        );
        // Create a copy of the account object to ensure immutability
        const updatedAccount = { ...accounts[accountIndex], isLoading: true };
        accounts[accountIndex] = updatedAccount;
        uiState$.apps.apps[appIndex].accounts.set(accounts);

        try {
          const rpcEndpoint = appsConfigs.find(
            (app) => app.id === appId
          )?.rpcEndpoint;
          if (!rpcEndpoint) throw new Error('RPC endpoint not found');
          console.log(`RPC endpoint found: ${rpcEndpoint} for appId: ${appId}`);

          const accountWithBalance = await uiState$.fetchAccountBalance(
            accounts[accountIndex],
            rpcEndpoint
          );
          console.log(
            `Fetched account balance for address: ${address}`,
            accountWithBalance
          );

          accounts[accountIndex] = { ...accountWithBalance, isLoading: false };
          uiState$.apps.apps[appIndex].accounts.set(accounts);
        } catch (error) {
          accounts[accountIndex] = { ...updatedAccount, isLoading: false };
          uiState$.apps.apps[appIndex].accounts.set(accounts);
          console.error(
            `Error synchronizing balance for account with address ${address} in app ${appId}:`,
            error
          );
        }
      } else {
        console.warn(
          `Account with address ${address} not found in app ${appId}`
        );
      }
    } else {
      console.warn(`App with appId ${appId} not found`);
    }
  },
  async loadInitialIcons() {
    if (iconsLoaded) return;

    const appIcons: AppIcons = {};

    const iconPromises = Object.values(appsConfigs)
      .filter((app) => app.rpcEndpoint)
      .map(async (app) => {
        const lightIconResponse = await getAppLightIcon(app.id);
        if (typeof lightIconResponse?.error === 'undefined') {
          appIcons[app.id] = lightIconResponse?.data;
        }
      });

    await Promise.all(iconPromises);
    uiState$.apps.icons.set(appIcons);
    iconsLoaded = true;
  },
  async migrateAccount(appId: AppIds, accountIndex: number) {
    const apps = uiState$.apps.apps.get();
    const appIndex = apps.findIndex((app) => app.id === appId);

    if (appIndex !== -1) {
      const accounts = apps[appIndex]?.accounts
        ? [...apps[appIndex].accounts]
        : [];

      if (accounts[accountIndex]) {
        // Create a copy of the account object to ensure immutability
        const updatedAccount = { ...accounts[accountIndex], isLoading: true };
        accounts[accountIndex] = updatedAccount;
        uiState$.apps.apps[appIndex].accounts.set(accounts);

        console.log(
          `Starting migration for account at index ${accountIndex} in app ${appId}`
        );

        try {
          const response = await ledgerWalletState$.migrateAccount(
            appId.toUpperCase(),
            accountIndex
          );

          if (response.migrated) {
            accounts[accountIndex] = {
              ...updatedAccount,
              status: 'migrated',
              isLoading: false
            };
            console.log(
              `Account at index ${accountIndex} in app ${appId} migrated successfully`
            );
          } else {
            accounts[accountIndex] = { ...updatedAccount, isLoading: false };
            console.log(
              `Account at index ${accountIndex} in app ${appId} migration failed`
            );
          }
          uiState$.apps.apps[appIndex].accounts.set(accounts);
        } catch (error) {
          accounts[accountIndex] = { ...updatedAccount, isLoading: false };
          uiState$.apps.apps[appIndex].accounts.set(accounts);
          console.log(
            `Error migrating account at index ${accountIndex} in app ${appId}:`,
            error
          );
        }
      }
    }
  },
  async migrateAll() {
    const apps = uiState$.apps.apps.get();

    try {
      // Iterate through each app
      for (const app of apps) {
        const appId = app.id;
        const accounts = app.accounts;

        if (!accounts || accounts.length === 0) continue;

        // Set app status to loading before starting migration
        const appIndex = apps.findIndex((a) => a.id === appId);
        if (appIndex === -1) continue;

        uiState$.apps.apps[appIndex].status.set('loading');

        // Migrate each account in the app
        for (
          let accountIndex = 0;
          accountIndex < accounts.length;
          accountIndex++
        ) {
          const account = accounts[accountIndex];

          // Skip accounts that are already migrated or have no balance
          if (
            account.status === 'migrated' ||
            !account.balance ||
            account.balance <= 0
          ) {
            continue;
          }

          try {
            await uiState$.migrateAccount(appId, accountIndex);
          } catch (error) {
            const errorDescription = `Failed to migrate account ${accountIndex} for app ${appId}:`;
            console.error(errorDescription, error);
            accounts[accountIndex] = {
              ...accounts[accountIndex],
              error: { source: 'migration', description: errorDescription }
            };
            uiState$.apps.apps[appIndex].accounts.set(accounts);
            // Continue with next account even if one fails
          }
        }

        // Update app status after all accounts are processed
        uiState$.apps.apps[appIndex].status.set('synchronized');
      }
    } catch (error) {
      console.error('Failed to complete migration:', error);
      uiState$.apps.error.set('Failed to complete migration');
    }
  }
});
