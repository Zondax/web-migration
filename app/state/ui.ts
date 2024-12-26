import { observable } from '@legendapp/state';
import { GenericeResponseAddress } from '@zondax/ledger-substrate/dist/common';
import type { AppsId } from 'app/config/apps';
import { appsConfigs } from 'app/config/apps';
import { ledgerWalletState$ } from './wallet/ledger';

export interface InternalApp extends GenericeResponseAddress {
  balance?: number;
}

export interface App {
  name: string;
  id: string;
  accounts?: InternalApp[];
  status?: 'synchronized' | 'loading';
}

interface UIState {
  device: {
    isConnected: boolean;
    isLoading: boolean;
    error?: string;
  };
  apps: {
    apps: App[];
    isLoading: boolean;
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
    apps: Object.values(appsConfigs).map(({ name }) => ({
      name,
      id: name,
      accounts: undefined
    })),
    isLoading: false,
    error: undefined
  }
};

export const uiState$ = observable({
  ...initialUIState,
  async connectLedger() {
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

    uiState$.apps.apps[app].set({
      ...apps[app],
      status: 'loading'
    });

    try {
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
      if (app !== undefined) {
        uiState$.apps.apps[app].set({
          ...apps[app],
          accounts: response.result,
          status: 'synchronized'
        });
      } else {
        uiState$.apps.error.set(`App with id ${appId} not found`);
      }
    } catch (error) {
      uiState$.apps.error.set('Failed to synchronize accounts');
      uiState$.apps.apps[app].set({
        ...apps[app],
        status: undefined
      });
    }
  }
});
