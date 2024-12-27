import { getBalance } from '@/lib/account';
import { observable } from '@legendapp/state';
import { GenericeResponseAddress } from '@zondax/ledger-substrate/dist/common';
import type { AppsId } from 'app/config/apps';
import { appsConfigs } from 'app/config/apps';
import { ledgerWalletState$ } from './wallet/ledger';

export interface Address extends GenericeResponseAddress {
  balance?: number;
}

export type AppStatus = 'synchronized' | 'loading' | 'error';

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
    error: undefined
  }
};

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
  async synchronizeAccount(appId: AppsId) {
    const apps = uiState$.apps.apps.get();
    const app = apps.findIndex((app) => app.name === appId);

    // Set the status of the app to 'loading' while synchronization is in progress
    uiState$.apps.apps[app].set({
      ...apps[app],
      status: 'loading'
    });

    try {
      // Attempt to synchronize the account with the Ledger device
      const response = await ledgerWalletState$.synchronizeAccount(
        appId.toUpperCase()
      );

      if (response.error) {
        uiState$.apps.apps[app].set({
          ...apps[app],
          status: undefined
        });
        return;
      }

      // If the app index is valid, update the app's accounts and status
      if (app !== undefined) {
        uiState$.apps.apps[app].set({
          ...apps[app],
          accounts: response.result,
          status: 'synchronized'
        });
      } else {
        // If the app was not found, set an error message
        uiState$.apps.error.set(`App with id ${appId} not found`);
      }
    } catch (error) {
      uiState$.apps.error.set('Failed to synchronize accounts');
      // Reset the app's status if an error occurs
      uiState$.apps.apps[app].set({
        ...apps[app],
        status: undefined
      });
    }
  },
  async synchronizeAccounts() {
    // reset the state, in case it was synchronized previously
    uiState$.apps.assign({ status: 'loading', apps: [] });

    try {
      // Check if the Ledger app is ready before proceeding
      const isAppReady = await ledgerWalletState$.isAppReady();
      if (!isAppReady) {
        uiState$.apps.assign({ status: undefined, apps: [] });
        return;
      }

      // request and save the accounts of each app synchronously
      for (const appId in appsConfigs) {
        const rpcEndpoint = appsConfigs[appId].rpcEndpoint;
        // Skip apps that do not have an rpcEndpoint defined
        if (!rpcEndpoint) {
          continue;
        }

        const response = await ledgerWalletState$.synchronizeAccount(appId);

        if (response.error) {
          uiState$.apps.apps.set([
            ...uiState$.apps.apps.get(),
            {
              name: appId,
              id: appId,
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
                const balance = await getBalance(address.address, rpcEndpoint);
                return {
                  ...address,
                  balance
                };
              })
            )
          : [];

        // Filter out addresses with zero balance
        const filteredAccounts = accounts.filter(
          (account) => account.balance && account.balance > 0
        );

        // Only set the app if there are accounts with non-zero balance
        if (filteredAccounts.length > 0) {
          uiState$.apps.apps.set([
            ...uiState$.apps.apps.get(),
            {
              name: appId,
              id: appId,
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
  }
});
