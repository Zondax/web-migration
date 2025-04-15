import { observable } from '@legendapp/state'
import { AppConfig, AppId, appsConfigs, polkadotAppConfig } from 'config/apps'
import { errorDetails, InternalErrors } from 'config/errors'
import { errorApps, syncApps } from 'config/mockData'

import { getApiAndProvider, getBalance } from '@/lib/account'
import { Token } from '@/lib/types/token'
import { convertSS58Format } from '@/lib/utils/address'
import { handleLedgerError } from '@/lib/utils/error'
import { hasBalance } from '@/lib/utils/ledger'

import { LedgerClientError } from './client/base'
import { ledgerClient } from './client/ledger'
import { notifications$ } from './notifications'
import { Address, Collection, DeviceConnectionProps, UpdateMigratedStatusFn } from './types/ledger'
import { Notification } from './types/notifications'

export type AppStatus = 'migrated' | 'synchronized' | 'loading' | 'error' | 'rescanning'

export type AppIcons = {
  [key in AppId]: string
}

export interface Collections {
  uniques: Map<number, Collection>
  nfts: Map<number, Collection>
}

export interface App {
  name: string
  id: AppId
  accounts?: Address[]
  collections?: Collections
  token: Token
  status?: AppStatus
  error?: {
    source: 'synchronization'
    description: string
  }
}

interface LedgerState {
  device: {
    connection?: DeviceConnectionProps
    isLoading: boolean
    error?: string
  }
  apps: {
    apps: App[]
    polkadotApp: App
    status?: AppStatus
    error?: string
    syncProgress: number
    completedTransactions: number
    migrationResult: {
      success: number
      fails: number
    }
  }
  polkadotAddresses: Partial<Record<AppId, string[]>>
}

const initialLedgerState: LedgerState = {
  device: {
    connection: undefined,
    isLoading: false,
    error: undefined,
  },
  apps: {
    apps: [],
    polkadotApp: polkadotAppConfig,
    status: undefined,
    error: undefined,
    syncProgress: 0,
    completedTransactions: 0,
    migrationResult: {
      success: 0,
      fails: 0,
    },
  },
  polkadotAddresses: {},
}

// Update App
function updateApp(appId: AppId, update: Partial<App>) {
  const apps = ledgerState$.apps.apps.get()
  const appIndex = apps.findIndex(app => app.id === appId)

  if (appIndex !== -1) {
    const updatedApp = { ...apps[appIndex], ...update }
    ledgerState$.apps.apps[appIndex].set(updatedApp)
  } else {
    console.warn(`App with id ${appId} not found for UI update.`)
  }
}

// Update Account
function updateAccount(appId: AppId, address: string, update: Partial<Address>) {
  const apps = ledgerState$.apps.apps.get()
  const appIndex = apps.findIndex(app => app.id === appId)

  if (appIndex !== -1) {
    const accounts = apps[appIndex]?.accounts ? [...apps[appIndex].accounts] : []
    const accountIndex = accounts.findIndex(account => account.address === address)

    if (accountIndex !== -1) {
      const updatedAccount = { ...accounts[accountIndex], ...update }
      accounts[accountIndex] = updatedAccount
      ledgerState$.apps.apps[appIndex].accounts.set(accounts)
    } else {
      console.warn(`Account with address ${address} not found in app ${appId} for UI update.`)
    }
  } else {
    console.warn(`App with appId ${appId} not found for account UI update.`)
  }
}

// Update Migrated Status
const updateMigratedStatus: UpdateMigratedStatusFn = (appId: AppId, accountPath: string, status, message, txDetails) => {
  const apps = ledgerState$.apps.apps.get()
  const appIndex = apps.findIndex(app => app.id === appId)

  if (appIndex !== -1) {
    const accounts = apps[appIndex]?.accounts ? [...apps[appIndex].accounts] : []

    const accountIndex = accounts.findIndex(account => account.path === accountPath)

    if (accounts[accountIndex]) {
      // Update the account's transaction details
      accounts[accountIndex] = {
        ...accounts[accountIndex],
        transaction: {
          status: status,
          statusMessage: message,
          hash: txDetails?.txHash,
          blockHash: txDetails?.blockHash,
          blockNumber: txDetails?.blockNumber,
        },
        isLoading: status === 'pending' || status === 'inBlock' || status === 'finalized',
      }
      ledgerState$.apps.apps[appIndex].accounts.set(accounts)
    }
  }
}

export const ledgerState$ = observable({
  ...initialLedgerState,
  async connectLedger(): Promise<{ connected: boolean; isAppOpen: boolean }> {
    // Set the loading state to true and clear any previous errors
    ledgerState$.device.isLoading.set(true)
    ledgerState$.device.error.set(undefined)

    try {
      const response = await ledgerClient.connectDevice()

      ledgerState$.device.connection.set(response?.connection)
      ledgerState$.device.error.set(response?.error) // Set error even if not connected

      const isDeviceConnected = Boolean(response?.connection && !response?.error)
      const isAppOpen = Boolean(response?.connection?.isAppOpen)

      // Check if device is connected but app is not open
      if (isDeviceConnected && !isAppOpen) {
        // Add notification to indicate the user should open the app
        notifications$.push({
          title: 'App not open',
          description: 'Please open the Polkadot Migration app on your Ledger device and click Connect again',
          type: 'warning',
          autoHideDuration: 5000,
        })
      }

      return { connected: isDeviceConnected, isAppOpen }
    } catch (error) {
      handleLedgerError(error as LedgerClientError, InternalErrors.CONNECTION_ERROR)

      return { connected: false, isAppOpen: false }
    } finally {
      ledgerState$.device.isLoading.set(false)
    }
  },

  disconnectLedger() {
    try {
      ledgerClient.disconnect()
      ledgerState$.clearConnection()
    } catch (error) {
      handleLedgerError(error as LedgerClientError, InternalErrors.DISCONNECTION_ERROR)
    }
  },

  // Clear connection data
  clearConnection() {
    ledgerState$.device.assign({
      connection: undefined,
      error: undefined,
      isLoading: false,
    })
    ledgerState$.clearSynchronization()
  },

  // Clear synchronization data
  clearSynchronization() {
    ledgerState$.apps.assign({
      apps: [],
      polkadotApp: polkadotAppConfig,
      status: undefined,
      error: undefined,
      syncProgress: 0,
      completedTransactions: 0,
      migrationResult: {
        success: 0,
        fails: 0,
      },
    })
    ledgerState$.polkadotAddresses.set({})
  },

  // Fetch and Process Accounts for a Single App
  async fetchAndProcessAccountsForApp(app: AppConfig, filterByBalance: boolean = true): Promise<App | undefined> {
    try {
      if (process.env.NEXT_PUBLIC_NODE_ENV === 'development' && errorApps?.includes(app.id)) {
        throw new Error('Mock synchronization error')
      }

      const response = await ledgerClient.synchronizeAccounts(app)

      if (!response.result || !app.rpcEndpoint) {
        return {
          name: app.name,
          id: app.id,
          token: app.token,
          status: 'error',
          error: {
            source: 'synchronization',
            description: 'Failed to synchronize accounts',
          },
        }
      }

      const polkadotAccounts = ledgerState$.apps.polkadotApp.get().accounts || []

      const { api, provider, error } = await getApiAndProvider(app.rpcEndpoint)

      if (error || !api) {
        return {
          name: app.name,
          id: app.id,
          token: app.token,
          status: 'error',
          error: {
            source: 'synchronization',
            description: errorDetails.blockchain_connection_error.description ?? '',
          },
        }
      }

      // Store collections for this address if they exist
      const collectionsMap = {
        uniques: new Map<number, Collection>(),
        nfts: new Map<number, Collection>(),
      }

      const accounts: Address[] = await Promise.all(
        response.result.map(async address => {
          const { balance, collections, error } = await getBalance(address, api)
          if (error) {
            return {
              ...address,
              balance,
              error: {
                source: 'balance_fetch',
                description: 'Failed to fetch balance',
              },
              isLoading: false,
            }
          }
          if (collections) {
            // Process uniques collections
            if (collections.uniques && collections.uniques.length > 0) {
              collections.uniques.forEach(collection => {
                if (collection.collectionId) {
                  collectionsMap.uniques.set(collection.collectionId, collection)
                }
              })
            }

            // Process nfts collections
            if (collections.nfts && collections.nfts.length > 0) {
              collections.nfts.forEach(collection => {
                if (collection.collectionId) {
                  collectionsMap.nfts.set(collection.collectionId, collection)
                }
              })
            }
          }

          return {
            ...address,
            balance,
            status: 'synchronized',
            error: undefined,
            isLoading: false,
          }
        })
      )

      const filteredAccounts = accounts.filter(account => !filterByBalance || hasBalance(account) || account.error)

      // Only set the app if there are accounts after filtering
      if (filteredAccounts.length > 0) {
        const polkadotAddresses = polkadotAccounts.map(account => convertSS58Format(account.address, app.ss58Prefix || 0))
        ledgerState$.polkadotAddresses[app.id].set(polkadotAddresses)

        if (api) {
          await api.disconnect()
        } else if (provider) {
          await provider.disconnect()
        }

        return {
          name: app.name,
          id: app.id,
          token: app.token,
          status: 'synchronized',
          accounts: filteredAccounts.map(account => ({
            ...account,
            destinationAddress: polkadotAddresses[0],
          })),
          collections: collectionsMap,
        }
      } else {
        notifications$.push({
          title: `No funds found`,
          description: `No accounts with balance to migrate for ${app.id.charAt(0).toUpperCase() + app.id.slice(1)}`,
          appId: app.id,
          type: 'info',
          autoHideDuration: 5000,
        })
      }

      return undefined // No accounts after filtering
    } catch (error) {
      console.log('Error fetching and processing accounts for app:', app.id)
      return {
        name: app.name,
        id: app.id,
        token: app.token,
        status: 'error',
        error: {
          source: 'synchronization',
          description: error instanceof Error ? error.message : 'Error fetching and processing accounts for app.',
        },
      }
    }
  },

  // Synchronize Single Account
  async synchronizeAccount(appId: AppId) {
    updateApp(appId, { status: 'rescanning', error: undefined })

    const appConfig = appsConfigs.get(appId)
    if (!appConfig) {
      console.error(`App with id ${appId} not found.`)
      return
    }

    try {
      const app = await ledgerState$.fetchAndProcessAccountsForApp(appConfig)
      if (app) {
        updateApp(appId, app)
      }
    } catch (error) {
      updateApp(appId, {
        status: 'error',
        error: {
          source: 'synchronization',
          description: 'Failed to synchronize accounts',
        },
      })
    }
  },

  // Fetch and Process Accounts for a Single App
  async fetchAndProcessPolkadotAccounts(): Promise<App | undefined> {
    try {
      const app = polkadotAppConfig
      const response = await ledgerClient.synchronizeAccounts(app)

      const noAccountsNotification: Omit<Notification, 'id' | 'createdAt'> = {
        title: `No migration source`,
        description: `No Polkadot accounts available to migrate from`,
        appId: app.id,
        type: 'info',
        autoHideDuration: 5000,
      }

      if (!response.result || !app.rpcEndpoint) {
        notifications$.push(noAccountsNotification)
        return {
          name: app.name,
          id: app.id,
          token: app.token,
          status: 'error',
        }
      }

      const accounts = response.result

      const { api, provider, error } = await getApiAndProvider(app.rpcEndpoint)

      if (error || !api) {
        return {
          name: app.name,
          id: app.id,
          token: app.token,
          status: 'error',
          error: {
            source: 'synchronization',
            description: errorDetails.blockchain_connection_error.description ?? '',
          },
        }
      }

      if (api) {
        await api.disconnect()
      } else if (provider) {
        await provider.disconnect()
      }

      // Only add a notification if there are no accounts after filtering
      if (accounts.length === 0) {
        notifications$.push(noAccountsNotification)
      }

      return {
        name: app.name,
        id: app.id,
        token: app.token,
        status: 'synchronized',
        accounts,
      }
    } catch (error) {
      const app = polkadotAppConfig
      console.log('Error fetching and processing accounts for app:', app.id)
      return {
        name: app.name,
        id: app.id,
        token: app.token,
        status: 'error',
      }
    }
  },

  // Synchronize Accounts
  async synchronizeAccounts() {
    ledgerState$.apps.assign({ status: 'loading', apps: [], syncProgress: 0 })

    try {
      const connection = ledgerState$.device.connection.get()
      if (!connection) {
        ledgerState$.apps.assign({
          status: undefined,
          apps: [],
          syncProgress: 0,
        })
        return
      }

      notifications$.push({
        title: `Synchronizing accounts`,
        description: `The first 5 accounts will be synchronized for each blockchain.`,
        type: 'info',
        autoHideDuration: 5000,
      })

      const polkadotApp = await ledgerState$.fetchAndProcessPolkadotAccounts()
      if (polkadotApp) {
        ledgerState$.apps.polkadotApp.set({
          ...polkadotApp,
          status: 'synchronized',
        })
      }

      // Get the total number of apps to synchronize
      let appsToSync: (AppConfig | undefined)[] = Array.from(appsConfigs.values())

      // If in development environment, use apps specified in environment variable
      if (process.env.NEXT_PUBLIC_NODE_ENV === 'development' && syncApps.length > 0) {
        try {
          appsToSync = syncApps.map(appId => appsConfigs.get(appId as AppId))
        } catch (error) {
          console.error('Error parsing NEXT_PUBLIC_SYNC_APPS environment variable:', error)
          return
        }
      }

      appsToSync = appsToSync.filter(appConfig => appConfig && appConfig.rpcEndpoint) as AppConfig[]
      const totalApps = appsToSync.length
      let syncedApps = 0

      // request and save the accounts of each app synchronously
      for (const appConfig of appsToSync) {
        if (appConfig) {
          // Comment it later
          const app = await ledgerState$.fetchAndProcessAccountsForApp(appConfig)
          if (app) {
            ledgerState$.apps.apps.push(app)
          }
        }

        // Update sync progress
        syncedApps++
        const progress = Math.round((syncedApps / totalApps) * 100)
        ledgerState$.apps.syncProgress.set(progress)
      }

      ledgerState$.apps.status.set('synchronized')
    } catch (error) {
      handleLedgerError(error as LedgerClientError, InternalErrors.SYNC_ERROR)
      ledgerState$.apps.error.set('Failed to synchronize accounts')
    }
  },

  // Synchronize Balance
  async getAccountBalance(appId: AppId, address: Address) {
    updateAccount(appId, address.address, { isLoading: true })
    const rpcEndpoint = appsConfigs.get(appId)?.rpcEndpoint

    if (!rpcEndpoint) {
      console.error('RPC endpoint not found for app:', appId)
      updateAccount(appId, address.address, {
        isLoading: false,
        error: {
          source: 'balance_fetch',
          description: 'RPC endpoint not found',
        },
      })
      return
    }

    const { api, provider, error } = await getApiAndProvider(rpcEndpoint)

    if (error || !api) {
      updateAccount(appId, address.address, {
        isLoading: false,
        error: {
          source: 'balance_fetch',
          description: errorDetails.balance_not_gotten.description ?? '',
        },
      })
      return
    }

    try {
      const { balance, collections, error } = await getBalance(address, api)
      if (!error) {
        updateAccount(appId, address.address, {
          ...address,
          balance,
          status: 'synchronized',
          error: undefined,
          isLoading: false,
        })

        if (collections && (collections.uniques.length > 0 || collections.nfts.length > 0)) {
          // Get existing collections for this app
          const apps = ledgerState$.apps.apps.get()
          const app = apps.find(a => a.id === appId)
          const existingCollections = app?.collections || {
            uniques: new Map<number, Collection>(),
            nfts: new Map<number, Collection>(),
          }

          // Merge with new collections
          const updatedCollections = {
            uniques: new Map(existingCollections.uniques),
            nfts: new Map(existingCollections.nfts),
          }
          collections.uniques.forEach(collection => {
            if (collection.collectionId) {
              updatedCollections.uniques.set(collection.collectionId, collection)
            }
          })
          collections.nfts.forEach(collection => {
            if (collection.collectionId) {
              updatedCollections.nfts.set(collection.collectionId, collection)
            }
          })
          updateApp(appId, {
            collections: updatedCollections,
          })
        }
      } else {
        updateAccount(appId, address.address, {
          isLoading: false,
          error: {
            source: 'balance_fetch',
            description: 'Failed to fetch balance',
          },
        })
      }
    } finally {
      if (api) {
        await api.disconnect()
      } else if (provider) {
        await provider.disconnect()
      }
    }
  },

  // Migrate Single Account
  async migrateAccount(appId: AppId, accountIndex: number) {
    const apps = ledgerState$.apps.apps.get()
    const app = apps.find(app => app.id === appId)
    const account = app?.accounts?.[accountIndex]

    console.log(`Starting migration for account at index ${accountIndex} in app ${appId}`)
    if (!account) {
      console.warn(`Account at index ${accountIndex} not found in app ${appId} for migration.`)
      return
    }

    updateAccount(appId, account.address, {
      isLoading: true,
      error: undefined,
    })

    try {
      console.log('Migrating account 1', account)
      const response = await ledgerClient.migrateAccount(appId, account, updateMigratedStatus)

      console.log('Migrating account 2', response)
      if (!response.migrated) {
        updateAccount(appId, account.address, {
          error: {
            source: 'migration',
            description: InternalErrors.MIGRATION_ERROR,
          },
          isLoading: false,
        })
        console.log(`Account at path ${account.path} in app ${appId} migration failed:`, InternalErrors.MIGRATION_ERROR)

        // Increment fails counter
        const currentMigrationResult = ledgerState$.apps.migrationResult.get()
        ledgerState$.apps.migrationResult.set({
          ...currentMigrationResult,
          fails: currentMigrationResult.fails + 1,
        })
      } else if (response.migrated) {
        updateAccount(appId, account.address, {
          status: 'migrated',
          isLoading: false,
        })

        // Increment completed transactions counter
        const currentCompletedTransactions = ledgerState$.apps.completedTransactions.get()
        ledgerState$.apps.completedTransactions.set(currentCompletedTransactions + 1)

        // Increment success counter
        const currentMigrationResult = ledgerState$.apps.migrationResult.get()
        ledgerState$.apps.migrationResult.set({
          ...currentMigrationResult,
          success: currentMigrationResult.success + 1,
        })

        console.log(`Account at index ${accountIndex} in app ${appId} migrated successfully`)
      } else {
        updateAccount(appId, account.address, { isLoading: false }) // Reset loading
      }
    } catch (error) {
      updateAccount(appId, account.address, {
        error: {
          source: 'migration',
          description: (error as LedgerClientError).message || 'Failed to migrate account',
        },
        isLoading: false,
      })

      // Increment fails counter
      const currentMigrationResult = ledgerState$.apps.migrationResult.get()
      ledgerState$.apps.migrationResult.set({
        ...currentMigrationResult,
        fails: currentMigrationResult.fails + 1,
      })
    }
  },

  // Migrate All Accounts within a Single App
  async migrateAppAccounts(app: App) {
    if (!app.accounts || app.accounts.length === 0) return

    // Set app status to loading before starting migration
    updateApp(app.id, { status: 'loading' })

    try {
      // Migrate each account in the app
      for (let accountIndex = 0; accountIndex < app.accounts.length; accountIndex++) {
        const account = app.accounts[accountIndex]

        // Skip accounts that are already migrated or have no balance
        if (account.status === 'migrated' || !hasBalance(account)) {
          continue
        }
        await ledgerState$.migrateAccount(app.id, accountIndex)
      }
    } catch (error) {
      handleLedgerError(error as LedgerClientError, InternalErrors.MIGRATION_ERROR)
    } finally {
      updateApp(app.id, { status: 'synchronized' })
    }
  },

  // Migrate All Accounts
  async migrateAll() {
    // Reset completed transactions counter before starting
    ledgerState$.apps.completedTransactions.set(0)
    // Reset migration result
    ledgerState$.apps.migrationResult.set({ success: 0, fails: 0 })

    try {
      const apps = ledgerState$.apps.apps.get()
      for (const app of apps) {
        await ledgerState$.migrateAppAccounts(app)
      }
    } catch (error) {
      handleLedgerError(error as LedgerClientError, InternalErrors.MIGRATION_ERROR)
      ledgerState$.apps.error.set('Failed to complete migration')
    }
  },
})
