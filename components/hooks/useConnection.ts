import { use$, useObservable } from '@legendapp/state/react';
import { useCallback } from 'react';
import { ledgerState$ } from 'state/ledger';

interface UseConnectionReturn {
  connectDevice: () => Promise<boolean>;
  disconnectDevice: () => void;
  isLedgerConnected: boolean;
}

/**
 * A hook that provides functionality for synchronizing and managing Ledger accounts
 */
export const useConnection = (): UseConnectionReturn => {
  const isLedgerConnected$ = useObservable(() =>
    Boolean(
      ledgerState$.device.connection?.transport.get() &&
        ledgerState$.device.connection?.genericApp.get()
    )
  );

  const isLedgerConnected = use$(isLedgerConnected$);
  console.log('isLedgerConnected', isLedgerConnected);
  // Handle device connection
  const connectDevice = useCallback(async () => {
    const { connected } = await ledgerState$.connectLedger();
    if (connected) {
      ledgerState$.synchronizeAccounts();
      return true;
    }
    return false;
  }, []);

  // Handle device disconnection
  const disconnectDevice = useCallback(() => {
    ledgerState$.disconnectLedger();
  }, []);

  return {
    // Actions
    connectDevice,
    disconnectDevice,
    isLedgerConnected
  };
};
