import { observable } from '@legendapp/state'
import { AppConfig, AppId, appsConfigs, polkadotAppConfig } from 'config/apps'
import { ErrorDetails, errorDetails, InternalErrors, LedgerErrors } from 'config/errors'
import { errorApps, syncApps } from 'config/mockData'

import { Token } from '@/config/apps'
import { maxAddressesToFetch } from '@/config/config'
import { getApiAndProvider, getBalance } from '@/lib/account'
import { DeviceConnectionProps } from '@/lib/ledger/types'
import { convertSS58Format } from '@/lib/utils/address'
import { mapLedgerError } from '@/lib/utils/error'
import { hasAddressBalance, hasBalance } from '@/lib/utils/ledger'

import { LedgerClientError } from './client/base'
import { ledgerClient } from './client/ledger'
import { notifications$ } from './notifications'
import { Address, AddressBalance, AddressStatus, Collection, TransactionStatus, UpdateMigratedStatusFn } from './types/ledger'
import { Notification } from './types/notifications'

export enum AppStatus {
  MIGRATED = 'migrated',
  SYNCHRONIZED = 'synchronized',
  LOADING = 'loading',
  ERROR = 'error',
  RESCANNING = 'rescanning',
}

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

type MigrationResultKey = 'success' | 'fails' | 'total'

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
    migrationResult: {
      [key in MigrationResultKey]: number
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
    migrationResult: {
      success: 0,
      fails: 0,
      total: 0,
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

// Update Migration Result Counter
function updateMigrationResultCounter(type: MigrationResultKey, increment = 1) {
  const currentMigrationResult = ledgerState$.apps.migrationResult.get() || {
    success: 0,
    fails: 0,
    total: 0,
  }
  ledgerState$.apps.migrationResult.set({
    ...currentMigrationResult,
    [type]: (currentMigrationResult[type] || 0) + increment,
  })
}

// Update Migrated Status
const updateMigratedStatus: UpdateMigratedStatusFn = (appId: AppId, accountPath: string, type, status, message, txDetails) => {
  const apps = ledgerState$.apps.apps.get()
  const appIndex = apps.findIndex(app => app.id === appId)

  if (appIndex !== -1) {
    const accounts = apps[appIndex]?.accounts ? [...apps[appIndex].accounts] : []

    const accountIndex = accounts.findIndex(account => account.path === accountPath)

    if (accountIndex !== -1 && accounts[accountIndex]) {
      // Update the account's transaction details
      accounts[accountIndex] = {
        ...accounts[accountIndex],
        balances: accounts[accountIndex].balances?.map(balance => {
          if (balance.type === type) {
            return {
              ...balance,
              transaction: {
                ...balance.transaction,
                status: status,
                statusMessage: message,
                hash: txDetails?.txHash,
                blockHash: txDetails?.blockHash,
                blockNumber: txDetails?.blockNumber,
              },
            }
          }
          return balance
        }),
      }

      // If the transaction is successful, mark as migrated
      if (status === TransactionStatus.SUCCESS) {
        accounts[accountIndex].status = AddressStatus.MIGRATED
        updateMigrationResultCounter('success')
      } else if (status === TransactionStatus.FAILED || status === TransactionStatus.ERROR) {
        updateMigrationResultCounter('fails')
      }

      ledgerState$.apps.apps[appIndex].accounts.set(accounts)
    }
  }
}

function handleLedgerError(error: LedgerClientError, defaultError: InternalErrors | LedgerErrors): ErrorDetails {
  const errorDetail = mapLedgerError(error, defaultError)

  notifications$.push({
    title: errorDetail.title,
    description: errorDetail.description ?? '',
    type: 'error',
    autoHideDuration: 5000,
  })

  return errorDetail
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
      migrationResult: {
        success: 0,
        fails: 0,
        total: 0,
      },
    })
    ledgerState$.polkadotAddresses.set({})
  },

  // Fetch and Process Accounts for a Single App
  async fetchAndProcessAccountsForApp(app: AppConfig, filterByBalance = true): Promise<App | undefined> {
    try {
      if (process.env.NEXT_PUBLIC_NODE_ENV === 'development' && errorApps && errorApps?.includes(app.id)) {
        throw new Error('Mock synchronization error')
      }

      const response = await ledgerClient.synchronizeAccounts(app)

      if (!response.result || !app.rpcEndpoint) {
        return {
          name: app.name,
          id: app.id,
          token: app.token,
          status: AppStatus.ERROR,
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
          status: AppStatus.ERROR,
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
          const { balances: balancesResponse, collections, error } = await getBalance(address, api)
          const balances = balancesResponse.filter(balance => hasBalance([balance]))

          if (error) {
            return {
              ...address,
              balances,
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
            balances,
            status: AddressStatus.SYNCHRONIZED,
            error: undefined,
            isLoading: false,
          }
        })
      )

      const filteredAccounts = accounts.filter(
        account => !filterByBalance || (account.balances && account.balances.length > 0) || account.error
      )

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
          status: AppStatus.SYNCHRONIZED,
          accounts: filteredAccounts.map(account => ({
            ...account,
            balances: account.balances?.map(balance => ({
              ...balance,
              transaction: {
                destinationAddress: polkadotAddresses[0], // default destination address
              },
            })),
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
      console.debug('Error fetching and processing accounts for app:', app.id)
      return {
        name: app.name,
        id: app.id,
        token: app.token,
        status: AppStatus.ERROR,
        error: {
          source: 'synchronization',
          description: error instanceof Error ? error.message : 'Error fetching and processing accounts for app.',
        },
      }
    }
  },

  // Synchronize Single Account
  async synchronizeAccount(appId: AppId) {
    updateApp(appId, { status: AppStatus.RESCANNING, error: undefined })

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
        status: AppStatus.ERROR,
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
          status: AppStatus.ERROR,
        }
      }

      const accounts = response.result

      const { api, provider, error } = await getApiAndProvider(app.rpcEndpoint)

      if (error || !api) {
        return {
          name: app.name,
          id: app.id,
          token: app.token,
          status: AppStatus.ERROR,
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
        status: AppStatus.SYNCHRONIZED,
        accounts,
      }
    } catch (error) {
      const app = polkadotAppConfig
      console.debug('Error fetching and processing accounts for app:', app.id)
      return {
        name: app.name,
        id: app.id,
        token: app.token,
        status: AppStatus.ERROR,
      }
    }
  },

  // Synchronize Accounts
  async synchronizeAccounts() {
    ledgerState$.apps.assign({
      status: AppStatus.LOADING,
      apps: [],
      syncProgress: 0,
    })

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
        description: `The first ${maxAddressesToFetch} accounts will be synchronized for each blockchain.`,
        type: 'info',
        autoHideDuration: 5000,
      })

      const polkadotApp = await ledgerState$.fetchAndProcessPolkadotAccounts()
      if (polkadotApp) {
        ledgerState$.apps.polkadotApp.set({
          ...polkadotApp,
          status: AppStatus.SYNCHRONIZED,
        })
      }

      // Get the total number of apps to synchronize
      let appsToSync: (AppConfig | undefined)[] = Array.from(appsConfigs.values())

      // If in development environment, use apps specified in environment variable
      if (process.env.NEXT_PUBLIC_NODE_ENV === 'development' && syncApps && syncApps.length > 0) {
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

      ledgerState$.apps.status.set(AppStatus.SYNCHRONIZED)
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
      const { balances, collections, error } = await getBalance(address, api)
      if (!error) {
        updateAccount(appId, address.address, {
          ...address,
          balances,
          status: AddressStatus.SYNCHRONIZED,
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

  async verifyDestinationAddresses(appId: AppId, address: string, path: string): Promise<{ isVerified: boolean }> {
    const appConfig = appsConfigs.get(appId)
    if (!appConfig) {
      console.error(`App with id ${appId} not found.`)
      return { isVerified: false }
    }

    // Find the index of the address in the polkadotAddresses array
    const polkadotAddresses = ledgerState$.polkadotAddresses[appId].get()
    if (!polkadotAddresses || polkadotAddresses.length === 0) {
      console.error(`No Polkadot addresses found for app ${appId}.`)
      return { isVerified: false }
    }

    // Find the index of the address in the polkadotAddresses array
    const addressIndex = polkadotAddresses.findIndex(addr => addr === address)
    if (addressIndex === -1) {
      console.error(`Address ${address} not found in Polkadot addresses for app ${appId}.`)
      return { isVerified: false }
    }

    const polkadotConfig = polkadotAppConfig
    try {
      const response = await ledgerClient.getAccountAddress(polkadotConfig.bip44Path, addressIndex, appConfig.ss58Prefix)

      return { isVerified: response.result?.address === address }
    } catch (error) {
      return { isVerified: false }
    }
  },

  // Migrate Single Account
  async migrateAccount(appId: AppId, accountIndex: number): Promise<{ txPromises: Promise<void>[] | undefined } | undefined> {
    const apps = ledgerState$.apps.apps.get()
    const app = apps.find(app => app.id === appId)
    const account = app?.accounts?.[accountIndex]

    console.debug(`Starting migration for account at index ${accountIndex} in app ${appId}`)
    if (!account) {
      console.warn(`Account at index ${accountIndex} not found in app ${appId} for migration.`)
      return undefined
    }

    // Check if account has balances to migrate
    if (account.balances && account.balances.length > 0) {
      // Migrate each balance individually
      const migrationPromises = []
      let hasFailures = false

      for (const balance of account.balances) {
        const migrationResult = await ledgerState$.migrateBalance(appId, account.address, account.path, balance)

        if (migrationResult?.txPromise) {
          migrationPromises.push(migrationResult.txPromise)
        } else {
          hasFailures = true
        }
      }

      if (migrationPromises.length > 0) {
        // At least one balance migration was successful
        console.debug(`Account at index ${accountIndex} in app ${appId} has ${migrationPromises.length} successful balance migrations`)

        // Return a promise that resolves when all migrations are complete
        return {
          txPromises: migrationPromises,
        }
      } else if (hasFailures) {
        // All balance migrations failed
        console.debug(`Account at index ${accountIndex} in app ${appId} had all balance migrations fail`)
        return undefined
      }
    }
  },

  // Migrate Balance for a specific account
  async migrateBalance(
    appId: AppId,
    address: string,
    path: string,
    balance: AddressBalance
  ): Promise<{ txPromise: Promise<void> | undefined } | undefined> {
    console.debug(`[${balance.type}] Starting balance migration for account ${address} in app ${appId}`)

    if (!balance.transaction?.destinationAddress) {
      console.warn(`[${balance.type}] No destination address set for account ${address}`)
      return undefined
    }

    updateMigratedStatus(appId, path, balance.type, TransactionStatus.IS_LOADING)

    updateMigrationResultCounter('total')

    try {
      const response = await ledgerClient.migrateAccount(appId, address, path, balance, updateMigratedStatus)

      if (!response?.txPromise) {
        updateMigratedStatus(appId, path, balance.type, TransactionStatus.ERROR, errorDetails.migration_error.description)

        // Increment fails counter
        updateMigrationResultCounter('fails')

        console.debug(`[${balance.type}] Balance migration for account ${address} in app ${appId} failed:`, InternalErrors.MIGRATION_ERROR)
        return undefined
      }

      // The transaction has been signed and sent, but has not yet been finalized
      updateMigratedStatus(appId, path, balance.type, TransactionStatus.PENDING)

      console.debug(`[${balance.type}] Balance migration for account ${address} in app ${appId} transaction submitted`)

      // Return the transaction promise
      return { txPromise: response.txPromise }
    } catch (error) {
      const statusMessage = (error as LedgerClientError).message || errorDetails.migration_error.description
      updateMigratedStatus(appId, path, balance.type, TransactionStatus.ERROR, statusMessage)

      // Increment fails counter
      updateMigrationResultCounter('fails')
      return undefined
    }
  },

  // Migrate All Accounts
  async migrateAll() {
    // Reset migration result
    ledgerState$.apps.migrationResult.set({ success: 0, fails: 0, total: 0 })

    try {
      const apps = ledgerState$.apps.apps.get()

      // Array to collect all transaction promises from all apps
      const allTransactionPromises: (Promise<void> | undefined)[] = []

      // Process apps to start their transactions
      for (const app of apps) {
        if (!app.accounts || app.accounts.length === 0) continue

        // Get accounts that need migration
        const accountsToMigrate = app.accounts
          .map((account, index) => ({ account, index }))
          // Skip accounts that are already migrated or have no balance
          .filter(({ account }) => account.status !== 'migrated' && hasAddressBalance(account))

        if (accountsToMigrate.length === 0) continue

        // Mark the app as in migration process
        updateApp(app.id, { status: AppStatus.LOADING })

        // Start transactions for each account in the app
        for (const { index } of accountsToMigrate) {
          const migrationResult = await ledgerState$.migrateAccount(app.id, index)
          if (migrationResult?.txPromises) {
            allTransactionPromises.push(...migrationResult.txPromises)
          }
        }

        // Mark the app as synchronized after processing all its accounts
        updateApp(app.id, { status: AppStatus.SYNCHRONIZED })
      }

      // We don't wait for transactions to complete, we process them in the background
      if (allTransactionPromises.length > 0) {
        const validPromises = allTransactionPromises.filter((p): p is Promise<void> => p !== undefined)

        // Monitor total progress in the background, without blocking
        await Promise.all(validPromises)
      }
    } catch (error) {
      handleLedgerError(error as LedgerClientError, InternalErrors.MIGRATION_ERROR)
      ledgerState$.apps.error.set('Failed to complete migration')
    }
  },
})
