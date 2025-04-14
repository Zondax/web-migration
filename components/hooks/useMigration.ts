import { useCallback } from 'react'
import { use$ } from '@legendapp/state/react'
import { App, ledgerState$ } from 'state/ledger'
import { Address } from 'state/types/ledger'

interface UseMigrationReturn {
  // Computed values
  filteredAppsWithoutErrors: App[]
  migrationResults: {
    success: number
    total: number
  }

  // Actions
  migrateAll: () => Promise<void>
  restartSynchronization: () => void
}

/**
 * A hook that provides functionality for synchronizing and managing Ledger accounts
 */
export const useMigration = (): UseMigrationReturn => {
  const apps$ = ledgerState$.apps.apps

  // Get all apps from the observable state
  const apps = use$(() => apps$.get())

  // Get migration results from the observable state
  const successMigration = use$(ledgerState$.apps.migrationResult.success)
  const failsMigration = use$(ledgerState$.apps.migrationResult.fails)

  // Compute derived values from apps
  const appsWithoutErrors = use$(() => {
    return apps
      .map(app => ({
        ...app,
        accounts: app.accounts?.filter((account: Address) => !account.error || account.error?.source === 'migration') || [],
      }))
      .filter(app => app.accounts.length > 0)
  })

  // Actions
  const migrateAll = useCallback(async () => {
    await ledgerState$.migrateAll()
  }, [])

  // Clear synchronization data
  const restartSynchronization = useCallback(() => {
    ledgerState$.clearSynchronization()
    ledgerState$.synchronizeAccounts()
  }, [])

  return {
    // Computed values
    filteredAppsWithoutErrors: appsWithoutErrors,
    migrationResults: {
      success: successMigration,
      total: successMigration + failsMigration,
    },

    // Actions
    migrateAll,
    restartSynchronization,
  }
}
