import { useCallback } from 'react'
import { use$, useObservable } from '@legendapp/state/react'
import { ledgerState$ } from 'state/ledger'

interface UseConnectionReturn {
  connectDevice: () => Promise<boolean>
  disconnectDevice: () => void
  isLedgerConnected: boolean
  isAppOpen: boolean
}

/**
 * A hook that provides functionality for synchronizing and managing Ledger accounts
 */
export const useConnection = (): UseConnectionReturn => {
  const isLedgerConnected$ = useObservable(() =>
    Boolean(ledgerState$.device.connection?.transport.get() && ledgerState$.device.connection?.genericApp.get())
  )

  const isLedgerConnected = use$(isLedgerConnected$)
  const isAppOpen = ledgerState$.device.connection?.get()?.isAppOpen ?? false

  // Handle device connection
  const connectDevice = useCallback(async () => {
    const result = await ledgerState$.connectLedger()

    if (result.connected && result.isAppOpen) {
      ledgerState$.synchronizeAccounts()
      return true
    }
    return false
  }, [])

  // Handle device disconnection
  const disconnectDevice = useCallback(() => {
    ledgerState$.disconnectLedger()
  }, [])

  return {
    // Actions
    connectDevice,
    disconnectDevice,
    isLedgerConnected,
    isAppOpen,
  }
}
