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
        const response = await ledgerWalletState$.synchronizeAccount(
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

        const response = await ledgerWalletState$.synchronizeAccount(app.id);

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

        // TODO: Make this asynchronous to allow continued synchronization of other accounts
        // Fetch the balance for each address
        const accounts: Address[] = response.result
          ? await Promise.all(
              response.result.map(async (address) => {
                const balanceResult = await getBalance(
                  address.address,
                  rpcEndpoint
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
  }
});
