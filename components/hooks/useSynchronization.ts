import { use$, useObservable } from '@legendapp/state/react'
import { useCallback, useState } from 'react'
import { type App, AppStatus, ledgerState$ } from 'state/ledger'

import { filterAppsWithErrors, filterAppsWithoutErrors, hasAccountsWithErrors } from '@/lib/utils'

interface UseSynchronizationReturn {
  // State
  status: AppStatus | undefined
  syncProgress: number
  isLedgerConnected: boolean
  isRescaning: boolean

  // Computed values
  hasAccountsWithErrors: boolean
  filteredAppsWithoutErrors: App[]
  filteredAppsWithErrors: App[]
  polkadotAddresses: string[]

  // Actions
  rescanFailedAccounts: () => Promise<void>
  restartSynchronization: () => void
}

/**
 * A hook that provides functionality for synchronizing and managing Ledger accounts
 */
export const useSynchronization = (): UseSynchronizationReturn => {
  const apps$ = ledgerState$.apps.apps
  const status = use$(ledgerState$.apps.status)
  const syncProgress = use$(ledgerState$.apps.syncProgress)
  const [isRescaning, setIsRescaning] = useState<boolean>(false)

  // Check if Ledger is connected
  const isLedgerConnected = use$(() => Boolean(ledgerState$.device.connection?.transport && ledgerState$.device.connection?.genericApp))

  // Get all apps from the observable state
  const apps = use$(() => apps$.get())

  // Compute derived values from apps
  const accountsWithErrors = use$(() => hasAccountsWithErrors(apps))
  const appsWithoutErrors = use$(() => filterAppsWithoutErrors(apps))
  const appsWithErrors = use$(() => filterAppsWithErrors(apps))

  // Extract Polkadot addresses
  const polkadotAddresses$ = useObservable(() => {
    return ledgerState$.apps.polkadotApp.accounts?.map(account => account.address)
  })

  const polkadotAddresses = use$(() => polkadotAddresses$.get())

  // Rescan all failed accounts and apps
  const rescanFailedAccounts = useCallback(async () => {
    if (isRescaning) return // Prevent multiple simultaneous rescans

    setIsRescaning(true)

    try {
      // Get the latest filtered apps with errors
      const appsToRescan = filterAppsWithErrors(apps$.get())

      for (const app of appsToRescan) {
        // Skip apps without a valid ID
        if (!app.id) continue

        if (app.status === AppStatus.ERROR) {
          // Rescan the entire app if it has an error status
          await ledgerState$.synchronizeAccount(app.id)
        } else if (app.accounts) {
          // Otherwise just rescan individual accounts with errors
          for (const account of app.accounts) {
            if (account.error && app.id) {
              await ledgerState$.getAccountBalance(app.id, account)
            }
          }
        }
      }
    } finally {
      setIsRescaning(false)
    }
  }, [isRescaning, apps$])

  // Clear synchronization data
  const restartSynchronization = useCallback(() => {
    ledgerState$.clearSynchronization()
    ledgerState$.synchronizeAccounts()
  }, [])

  return {
    // State
    status,
    syncProgress,
    isLedgerConnected,
    isRescaning,

    // Computed values
    hasAccountsWithErrors: accountsWithErrors,
    filteredAppsWithoutErrors: appsWithoutErrors,
    filteredAppsWithErrors: appsWithErrors,
    polkadotAddresses: polkadotAddresses,

    // Actions
    rescanFailedAccounts,
    restartSynchronization,
  }
}
