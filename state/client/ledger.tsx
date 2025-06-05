import { GenericeResponseAddress } from '@zondax/ledger-substrate/dist/common'
import { AppConfig, AppId, appsConfigs } from 'config/apps'
import { maxAddressesToFetch } from 'config/config'
import { InternalErrors } from 'config/errors'

import { MINIMUM_AMOUNT } from '@/config/mockData'
import {
  createSignedExtrinsic,
  getApiAndProvider,
  getProxyInfo,
  prepareTransaction,
  removeProxy,
  submitAndHandleTransaction,
} from '@/lib/account'
import { ledgerService } from '@/lib/ledger/ledgerService'
import { hasBalance } from '@/lib/utils'
import { getBip44Path } from '@/lib/utils/address'

import { Address, ConnectionResponse, TransactionStatus, UpdateMigratedStatusFn } from '../types/ledger'
import { withErrorHandling } from './base'

export const ledgerClient = {
  // Device operations
  async connectDevice(onDisconnect?: () => void): Promise<ConnectionResponse | undefined> {
    return withErrorHandling(() => ledgerService.connectDevice(onDisconnect), InternalErrors.CONNECTION_ERROR)
  },

  async synchronizeAccounts(app: AppConfig): Promise<{ result?: Address[] }> {
    return withErrorHandling(async () => {
      // fetch addresses
      const addresses: (GenericeResponseAddress | undefined)[] = []
      for (let i = 0; i < maxAddressesToFetch; i++) {
        const derivedPath = getBip44Path(app.bip44Path, i)
        const address = await ledgerService.getAccountAddress(derivedPath, app.ss58Prefix, false)
        addresses.push({ ...address, path: derivedPath } as Address)
      }

      const filteredAddresses = addresses.filter((address): address is Address => address !== undefined)

      return { result: filteredAddresses }
    }, InternalErrors.SYNC_ERROR)
  },

  async getAccountAddress(bip44Path: string, index: number, ss58Prefix: number): Promise<{ result?: Address }> {
    return withErrorHandling(async () => {
      // get address
      const derivedPath = getBip44Path(bip44Path, index)
      const genericAddress = await ledgerService.getAccountAddress(derivedPath, ss58Prefix, true)
      const address: Address = { ...genericAddress, path: derivedPath } as Address

      return { result: address }
    }, InternalErrors.SYNC_ERROR)
  },

  async migrateAccount(
    appId: AppId,
    account: Address,
    updateStatus: UpdateMigratedStatusFn
  ): Promise<{ txPromise?: Promise<void> } | undefined> {
    const senderAddress = account.address
    const appConfig = appsConfigs.get(appId)
    console.log('account', account)

    if (!appConfig) {
      throw InternalErrors.APP_CONFIG_NOT_FOUND
    }
    if (!appConfig.rpcEndpoint) {
      throw InternalErrors.APP_CONFIG_NOT_FOUND
    }
    return withErrorHandling(async () => {
      const { api, error } = await getApiAndProvider(appConfig.rpcEndpoint!)
      if (error || !api) {
        throw new Error(error ?? 'Failed to connect to the blockchain.')
      }
      console.log('senderAddress', senderAddress)

      await getProxyInfo(senderAddress, api)

      const removeProxyTx = await removeProxy(senderAddress, api, appConfig, account.path)

      const updateMigratedStatus = (
        status: TransactionStatus,
        message?: string,
        txDetails?: {
          txHash?: string
          blockHash?: string
          blockNumber?: string
        }
      ) => {
        updateStatus(appConfig.id, account.path, status, message, txDetails)
      }

      // Create transaction promise but don't await it
      const txPromise = submitAndHandleTransaction(removeProxyTx, updateMigratedStatus, api)

      return { txPromise }
    }, InternalErrors.UNKNOWN_ERROR)
  },

  clearConnection() {
    ledgerService.clearConnection()
  },

  disconnect() {
    ledgerService.disconnect()
  },
}
