import { observable } from '@legendapp/state'
import { use$ } from '@legendapp/state/react'
import { useCallback, useEffect } from 'react'
import { type App, ledgerState$ } from 'state/ledger'

import type { AppId } from '@/config/apps'
import { filterAppsWithoutErrors } from '@/lib/utils'

export type VerificationStatus = 'pending' | 'verifying' | 'verified' | 'failed'

export interface AddressWithVerificationStatus {
  address: string
  path: string
  status: VerificationStatus
}

interface UseMigrationReturn {
  // Computed values
  filteredAppsWithoutErrors: App[]
  migrationResults: {
    success: number
    total: number
  }
  destinationAddressesByApp: Record<AppId, AddressWithVerificationStatus[]>

  // Verification related
  allVerified: boolean
  anyFailed: boolean
  isVerifying: boolean
  verifyDestinationAddresses: () => Promise<void>
  verifyFailedAddresses: () => Promise<void>

  // Migration actions
  migrateAll: () => Promise<void>
  restartSynchronization: () => void
}

// Create the observable outside of the hook to ensure it persists across renders
const destinationAddressesStatus$ = observable<Record<AppId, AddressWithVerificationStatus[]>>({})
// Create an observable for tracking verification in progress
const isVerifying$ = observable(false)

/**
 * A hook that provides functionality for migrating and verifying Ledger accounts
 */
export const useMigration = (): UseMigrationReturn => {
  const apps$ = ledgerState$.apps.apps

  // Get all apps from the observable state
  const apps = use$(() => apps$.get())

  // Get migration results from the observable state
  const successMigration = use$(ledgerState$.apps.migrationResult.success)
  const totalMigration = use$(ledgerState$.apps.migrationResult.total)

  // Compute derived values from apps
  const appsWithoutErrors = use$(() => filterAppsWithoutErrors(apps))

  // Get destination addresses used for each app
  const destinationAddressesByApp = use$(() =>
    appsWithoutErrors.reduce((acc: Record<AppId, AddressWithVerificationStatus[]>, app) => {
      if (app.accounts && app.accounts.length > 0) {
        // Create a map to track unique addresses with their paths
        const addressMap = new Map<string, AddressWithVerificationStatus>()

        // Process each account and only keep unique destination addresses
        for (const account of app.accounts) {
          if (account.balances && account.balances.length > 0) {
            for (const balance of account.balances) {
              if (balance.transaction?.destinationAddress && !addressMap.has(balance.transaction.destinationAddress)) {
                addressMap.set(balance.transaction.destinationAddress, {
                  address: balance.transaction.destinationAddress,
                  path: account.path,
                  status: 'pending',
                })
              }
            }
          }
        }

        // Convert the map values to an array
        const uniqueDestinationAddresses = Array.from(addressMap.values())

        if (uniqueDestinationAddresses.length > 0) {
          acc[app.id] = uniqueDestinationAddresses
        }
      }
      return acc
    }, {})
  )

  // Get the latest state of address verification status
  const destinationAddressesStatus = use$(() => destinationAddressesStatus$.get())
  // Get the verification in progress state
  const isVerifying = use$(() => isVerifying$.get())

  // Initialize or update the observable with the latest data from destinationAddressesByApp
  useEffect(() => {
    // Update the observable with the latest data
    for (const [appId, addresses] of Object.entries(destinationAddressesByApp)) {
      // If we don't have this app in our status observable yet, or the addresses count changed
      if (
        !destinationAddressesStatus$[appId as AppId].peek() ||
        destinationAddressesStatus$[appId as AppId].peek()?.length !== addresses.length
      ) {
        destinationAddressesStatus$[appId as AppId].set(addresses)
      }
    }
  }, [destinationAddressesByApp])

  // ---- Verification related functions ----

  /**
   * Verify a single address with the Ledger device
   */
  const verifyAddress = useCallback(async (appId: AppId, addressIndex: number): Promise<void> => {
    const address = destinationAddressesStatus$[appId][addressIndex].peek()

    // Update the verification status to 'verifying'
    destinationAddressesStatus$[appId][addressIndex].status.set('verifying')

    const response = await ledgerState$.verifyDestinationAddresses(appId, address.address, address.path)

    // The property is spelled 'isVerified' in the API response
    destinationAddressesStatus$[appId][addressIndex].status.set(response.isVerified ? 'verified' : 'failed')
  }, [])

  /**
   * Verify all destination addresses
   */
  const verifyDestinationAddresses = useCallback(async () => {
    isVerifying$.set(true)

    try {
      // Iterate through each app and verify all destination addresses
      for (const appId of Object.keys(destinationAddressesStatus$.peek())) {
        const addresses = destinationAddressesStatus$[appId as AppId].peek() || []

        for (let i = 0; i < addresses.length; i++) {
          await verifyAddress(appId as AppId, i)
        }
      }
    } finally {
      isVerifying$.set(false)
    }
  }, [verifyAddress])

  /**
   * Verify only the addresses that have failed verification
   */
  const verifyFailedAddresses = useCallback(async () => {
    isVerifying$.set(true)

    try {
      // Iterate through each app and verify only failed destination addresses
      for (const appId of Object.keys(destinationAddressesStatus$.peek())) {
        const addresses = destinationAddressesStatus$[appId as AppId].peek() || []

        for (let i = 0; i < addresses.length; i++) {
          const address = destinationAddressesStatus$[appId as AppId][i].peek()

          // Only verify addresses with failed status
          if (address.status === 'failed') {
            await verifyAddress(appId as AppId, i)
          }
        }
      }
    } finally {
      isVerifying$.set(false)
    }
  }, [verifyAddress])

  // Compute verification status flags
  const allVerified = use$(() => {
    const addresses = Object.values(destinationAddressesStatus).flat()
    return addresses.length > 0 && addresses.every(addr => addr.status === 'verified')
  })

  const anyFailed = use$(() => {
    return Object.values(destinationAddressesStatus)
      .flat()
      .some(addr => addr.status === 'failed')
  })

  // ---- Migration related functions ----

  /**
   * Migrate all accounts
   */
  const migrateAll = useCallback(async () => {
    await ledgerState$.migrateAll()
  }, [])

  /**
   * Clear synchronization data and restart the synchronization process
   */
  const restartSynchronization = useCallback(() => {
    // Clear synchronization data
    ledgerState$.clearSynchronization()
    // Restart synchronization process
    ledgerState$.synchronizeAccounts()
    // Reset verification status
    destinationAddressesStatus$.set({})
    isVerifying$.set(false)
  }, [])

  return {
    // Computed values
    filteredAppsWithoutErrors: appsWithoutErrors,
    migrationResults: {
      success: successMigration,
      total: totalMigration,
    },
    destinationAddressesByApp: destinationAddressesStatus,

    // Verification related
    allVerified,
    anyFailed,
    isVerifying,
    verifyDestinationAddresses,
    verifyFailedAddresses,

    // Migration actions
    migrateAll,
    restartSynchronization,
  }
}
