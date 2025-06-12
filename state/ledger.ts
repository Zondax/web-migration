import { observable } from '@legendapp/state'
import { type AppConfig, type AppId, appsConfigs, polkadotAppConfig } from 'config/apps'
import { type ErrorDetails, InternalErrors, type LedgerErrors, errorDetails } from 'config/errors'
import { errorApps, syncApps } from 'config/mockData'

import type { Token } from '@/config/apps'
import { maxAddressesToFetch } from '@/config/config'
import { type UpdateTransactionStatus, getApiAndProvider, getBalance, getIdentityInfo } from '@/lib/account'
import type { DeviceConnectionProps } from '@/lib/ledger/types'
import { convertSS58Format } from '@/lib/utils/address'
import { hasAddressBalance, hasBalance } from '@/lib/utils/balance'
import { mapLedgerError } from '@/lib/utils/error'

import type { LedgerClientError } from './client/base'
import { ledgerClient } from './client/ledger'
import { notifications$ } from './notifications'
import {
  type Address,
  AddressStatus,
  type Collection,
  type MigratingItem,
  type Registration,
  TransactionStatus,
  type UpdateMigratedStatusFn,
} from './types/ledger'
import type { Notification } from './types/notifications'

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
    syncProgress: {
      scanned: number
      total: number
      percentage: number
    }
    isSyncCancelRequested: boolean
    migrationResult: {
      [key in MigrationResultKey]: number
    }
    currentMigratedItem?: MigratingItem
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
    syncProgress: {
      scanned: 0,
      total: 0,
      percentage: 0,
    },
    isSyncCancelRequested: false,
    migrationResult: {
      success: 0,
      fails: 0,
      total: 0,
    },
    currentMigratedItem: undefined,
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
    const app = apps[appIndex]

    const accountIndex = accounts.findIndex(account => account.path === accountPath)

    if (accountIndex !== -1 && accounts[accountIndex]) {
      // Update the account's transaction details
      accounts[accountIndex] = {
        ...accounts[accountIndex],
        balances: accounts[accountIndex].balances?.map(balance => {
          if (balance.type === type) {
            // If the status is IS_LOADING, set the currentMigratedItem
            if (status === TransactionStatus.IS_LOADING) {
              ledgerState$.apps.currentMigratedItem.set({
                appId,
                appName: app.name || app.id,
                account: accounts[accountIndex],
                transaction: {
                  status: TransactionStatus.IS_LOADING,
                  statusMessage: message,
                  hash: txDetails?.txHash,
                  blockHash: txDetails?.blockHash,
                  blockNumber: txDetails?.blockNumber,
                },
              })
            } else {
              // Only clear if this is the currently migrating item
              const currentItem = ledgerState$.apps.currentMigratedItem.get()
              if (currentItem?.appId === appId && currentItem?.account.path === accountPath) {
                // Clear for other statuses (SUCCESS, FAILED, ERROR)
                ledgerState$.apps.currentMigratedItem.set(undefined)
              }
            }

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
          title: 'Polkadot Migration App not open',
          description:
            'Please open the Polkadot Migration App on your Ledger device. Once the app is open, click Connect again to continue.',
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
      syncProgress: {
        scanned: 0,
        total: 0,
        percentage: 0,
      },
      isSyncCancelRequested: false,
      migrationResult: {
        success: 0,
        fails: 0,
        total: 0,
      },
      currentMigratedItem: undefined,
    })
    ledgerState$.polkadotAddresses.set({})
  },

  // Stop synchronization without deleting already synchronized accounts
  cancelSynchronization() {
    ledgerState$.apps.isSyncCancelRequested.set(true)

    // Set status to synchronized to indicate that the process was stopped
    ledgerState$.apps.status.set(AppStatus.SYNCHRONIZED)

    notifications$.push({
      title: 'Synchronization Stopped',
      description: 'The synchronization process has been stopped. You can continue with the accounts that were already synchronized.',
      type: 'info',
      autoHideDuration: 5000,
    })
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
          const { balances: balancesResponse, collections, error } = await getBalance(address, api, app.id)
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
              for (const collection of collections.uniques) {
                if (collection.collectionId) {
                  collectionsMap.uniques.set(collection.collectionId, collection)
                }
              }
            }

            // Process nfts collections
            if (collections.nfts && collections.nfts.length > 0) {
              for (const collection of collections.nfts) {
                if (collection.collectionId) {
                  collectionsMap.nfts.set(collection.collectionId, collection)
                }
              }
            }
          }
          let registration: Registration | undefined
          if (app.peopleRpcEndpoint) {
            const { api: peopleApi, error: peopleError } = await getApiAndProvider(app.peopleRpcEndpoint)

            if (!peopleError && peopleApi) {
              registration = await getIdentityInfo(address.address, peopleApi)
            }
          }

          return {
            ...address,
            balances,
            registration,
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
      }

      if (ledgerState$.apps.isSyncCancelRequested.get()) {
        return undefined
      }

      notifications$.push({
        title: 'No accounts to migrate',
        description: `We could not find any accounts with a balance to migrate for ${app.id.charAt(0).toUpperCase() + app.id.slice(1)}.`,
        appId: app.id,
        type: 'info',
        autoHideDuration: 5000,
      })

      // No accounts after filtering
      return {
        name: app.name,
        id: app.id,
        token: app.token,
        status: AppStatus.SYNCHRONIZED,
        accounts: [],
      }
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
      updateApp(appId, { status: AppStatus.LOADING, error: undefined })

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
        title: 'No Polkadot accounts found',
        description: 'There are no Polkadot accounts available to migrate from on your Ledger device.',
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
    ledgerState$.apps.isSyncCancelRequested.set(false)
    ledgerState$.apps.assign({
      status: AppStatus.LOADING,
      apps: [],
      syncProgress: {
        scanned: 0,
        total: 0,
        percentage: 0,
      },
    })

    try {
      const connection = ledgerState$.device.connection.get()
      if (!connection) {
        ledgerState$.apps.assign({
          status: undefined,
          apps: [],
          syncProgress: {
            scanned: 0,
            total: 0,
            percentage: 0,
          },
        })
        return
      }

      notifications$.push({
        title: 'Synchronizing accounts',
        description: `We are synchronizing the first ${maxAddressesToFetch} accounts for each blockchain. Please wait while we gather your account information.`,
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

      appsToSync = appsToSync.filter(appConfig => appConfig?.rpcEndpoint) as AppConfig[]
      const totalApps = appsToSync.length
      let syncedApps = 0

      ledgerState$.apps.syncProgress.set({
        scanned: syncedApps,
        total: totalApps,
        percentage: 0,
      })

      // request and save the accounts of each app synchronously
      for (const appConfig of appsToSync) {
        // Check if cancellation is requested
        if (ledgerState$.apps.isSyncCancelRequested.get()) {
          return undefined
        }

        if (appConfig) {
          ledgerState$.apps.apps.push({
            id: appConfig.id,
            name: appConfig.name,
            token: appConfig.token,
            status: AppStatus.LOADING,
            error: undefined,
          })

          // Comment it later
          const app = await ledgerState$.fetchAndProcessAccountsForApp(appConfig)
          if (app) {
            updateApp(appConfig.id, app)
          }
        }

        // Update sync progress
        syncedApps++
        const progress = Math.round((syncedApps / totalApps) * 100)
        ledgerState$.apps.syncProgress.scanned.set(syncedApps)
        ledgerState$.apps.syncProgress.percentage.set(progress)
      }

      // Reset cancel flag when synchronization completes successfully
      ledgerState$.apps.isSyncCancelRequested.set(false)
      ledgerState$.apps.status.set(AppStatus.SYNCHRONIZED)
    } catch (error) {
      handleLedgerError(error as LedgerClientError, InternalErrors.SYNC_ERROR)
      ledgerState$.apps.error.set('Failed to synchronize accounts')
    } finally {
      // Ensure we reset the cancel flag even if there was an error
      if (ledgerState$.apps.isSyncCancelRequested.get()) {
        ledgerState$.apps.isSyncCancelRequested.set(false)
      }
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
      const { balances, collections, error } = await getBalance(address, api, appId)
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
          for (const collection of collections.uniques) {
            if (collection.collectionId) {
              updatedCollections.uniques.set(collection.collectionId, collection)
            }
          }
          for (const collection of collections.nfts) {
            if (collection.collectionId) {
              updatedCollections.nfts.set(collection.collectionId, collection)
            }
          }
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

  async verifyDestinationAddresses(
    appId: AppId,
    address: string,
    path: string
  ): Promise<{
    isVerified: boolean
  }> {
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
      notifications$.push({
        title: 'Verify address on Ledger',
        description:
          'Please review and confirm the address on your Ledger device. This step is required to ensure your funds are sent to the correct destination.',
        type: 'info',
        autoHideDuration: 7000,
      })
      const response = await ledgerClient.getAccountAddress(polkadotConfig.bip44Path, addressIndex, appConfig.ss58Prefix)

      return { isVerified: response.result?.address === address }
    } catch (error) {
      return { isVerified: false }
    }
  },

  // Migrate Single Account
  async migrateAccount(
    appId: AppId,
    accountIndex: number
  ): Promise<
    | {
        txPromises: Promise<void>[] | undefined
      }
    | undefined
  > {
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

      for (const balanceIndex in account.balances) {
        const migrationResult = await ledgerState$.migrateBalance(appId, account, account.path, Number.parseInt(balanceIndex))

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
      }
      if (hasFailures) {
        // All balance migrations failed
        console.debug(`Account at index ${accountIndex} in app ${appId} had all balance migrations fail`)
        return undefined
      }
    }
  },

  // Migrate Balance for a specific account
  async migrateBalance(
    appId: AppId,
    account: Address,
    path: string,
    balanceIndex: number
  ): Promise<
    | {
        txPromise: Promise<void> | undefined
      }
    | undefined
  > {
    const balance = account.balances?.[balanceIndex]
    if (!balance) {
      console.warn(`Balance at index ${balanceIndex} not found for account ${account.address} in app ${appId}`)
      return undefined
    }

    console.debug(`[${balance.type}] Starting balance migration for account ${account.address} in app ${appId}`)

    if (!balance.transaction?.destinationAddress) {
      console.warn(`[${balance.type}] No destination address set for account ${account.address}`)
      return undefined
    }

    updateMigratedStatus(appId, path, balance.type, TransactionStatus.IS_LOADING)

    updateMigrationResultCounter('total')

    try {
      const response = await ledgerClient.migrateAccount(appId, account, path, updateMigratedStatus, balanceIndex)

      if (!response?.txPromise) {
        updateMigratedStatus(appId, path, balance.type, TransactionStatus.ERROR, errorDetails.migration_error.description)

        // Increment fails counter
        updateMigrationResultCounter('fails')

        console.debug(
          `[${balance.type}] Balance migration for account ${account.address} in app ${appId} failed:`,
          InternalErrors.MIGRATION_ERROR
        )
        return undefined
      }

      // The transaction has been signed and sent, but has not yet been finalized
      updateMigratedStatus(appId, path, balance.type, TransactionStatus.PENDING)

      console.debug(`[${balance.type}] Balance migration for account ${account.address} in app ${appId} transaction submitted`)

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

  async unstakeBalance(appId: AppId, address: string, path: string, amount: number, updateTxStatus: UpdateTransactionStatus) {
    const appConfig = appsConfigs.get(appId)
    if (!appConfig) {
      console.error(`App with id ${appId} not found.`)
      return
    }

    try {
      await ledgerClient.unstakeBalance(appId, address, path, amount, updateTxStatus)
    } catch (error) {
      const errorDetail = (error as LedgerClientError).message || errorDetails.unstake_error.description
      updateTxStatus(TransactionStatus.ERROR, errorDetail)
    }
  },

  async getUnstakeFee(appId: AppId, address: string, amount: number): Promise<string | undefined> {
    const appConfig = appsConfigs.get(appId)
    if (!appConfig) {
      console.error(`App with id ${appId} not found.`)
      return
    }

    try {
      const estimatedFee = await ledgerClient.getUnstakeFee(appId, address, amount)
      return estimatedFee
    } catch (error) {
      return undefined
    }
  },

  async withdrawBalance(appId: AppId, address: string, path: string, updateTxStatus: UpdateTransactionStatus) {
    const appConfig = appsConfigs.get(appId)
    if (!appConfig) {
      console.error(`App with id ${appId} not found.`)
      return
    }

    try {
      await ledgerClient.withdrawBalance(appId, address, path, updateTxStatus)
    } catch (error) {
      const errorDetail = (error as LedgerClientError).message || errorDetails.withdraw_error.description
      updateTxStatus(TransactionStatus.ERROR, errorDetail)
    }
  },

  async getWithdrawFee(appId: AppId, address: string): Promise<string | undefined> {
    const appConfig = appsConfigs.get(appId)
    if (!appConfig) {
      console.error(`App with id ${appId} not found.`)
      return
    }

    try {
      return await ledgerClient.getWithdrawFee(appId, address)
    } catch (error) {
      return undefined
    }
  },

  async removeIdentity(appId: AppId, address: string, path: string, updateTxStatus: UpdateTransactionStatus) {
    try {
      await ledgerClient.removeIdentity(appId, address, path, updateTxStatus)
    } catch (error) {
      const errorDetail = (error as LedgerClientError).message || errorDetails.remove_identity_error.description
      updateTxStatus(TransactionStatus.ERROR, errorDetail)
    }
  },

  async getRemoveIdentityFee(appId: AppId, address: string): Promise<string | undefined> {
    try {
      return await ledgerClient.getRemoveIdentityFee(appId, address)
    } catch (error) {
      return undefined
    }
  },
})
