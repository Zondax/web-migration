import { observable } from '@legendapp/state';
import { ledgerWalletState$ } from './wallet/ledger';

interface UIState {
  ledger: {
    isConnected: boolean;
    isLoading: boolean;
    error?: string;
  };
}

const initialUIState: UIState = {
  ledger: {
    isConnected: false,
    isLoading: false,
    error: undefined
  }
};

export const uiState$ = observable({
  ...initialUIState,
  async connectLedger() {
    uiState$.ledger.isLoading.set(true);
    uiState$.ledger.error.set(undefined);

    try {
      const response = await ledgerWalletState$.connectDevice();

      if (!response?.connected) {
        uiState$.ledger.error.set(response?.error);
      } else {
        uiState$.ledger.isConnected.set(true);
      }

      return { connected: response?.connected };
    } catch (error) {
      uiState$.ledger.error.set('Failed to connect to Ledger');
      return { connected: false };
    } finally {
      uiState$.ledger.isLoading.set(false);
    }
  },
  disconnectLedger() {
    ledgerWalletState$.disconnect();
    uiState$.ledger.isConnected.set(false);
  }
});
