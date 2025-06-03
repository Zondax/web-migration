import { GenericeResponseAddress } from '@zondax/ledger-substrate/dist/common'
import { AppConfig, AppId, appsConfigs } from 'config/apps'
import { maxAddressesToFetch } from 'config/config'
import { InternalErrors } from 'config/errors'

import { MINIMUM_AMOUNT } from '@/config/mockData'
import { createApproveAsMulti, createAsMulti, createSignedExtrinsic, getApiAndProvider, prepareTransaction, submitAndHandleTransaction } from '@/lib/account'
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

    // Multisig flow
    console.log('senderAddress', senderAddress)
    const multisigSignatureFlow = await createApproveAsMulti(senderAddress, api, appConfig, account.path)
    console.log('multisigSignatureFlow', multisigSignatureFlow)
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

    // Create transaction promise for the first approval
    const firstTxPromise = submitAndHandleTransaction(multisigSignatureFlow, updateMigratedStatus, api)

    // Chain the second transaction after the first one completes
    const completeTxPromise = firstTxPromise.then(async () => {
      console.log('First multisig approval completed, now creating final signature...')
      
      // Create new API connection for the second transaction
      const { api: api2, error: error2 } = await getApiAndProvider(appConfig.rpcEndpoint!)
      if (error2 || !api2) {
        throw new Error(error2 ?? 'Failed to connect to the blockchain for final signature.')
      }

      // Create the final asMulti transaction
      const second_address = 'FZZMnXGjS3AAWVtuyq34MuZ4vuNRSbk96ErDV4q25S9p7tn'
      const finalMultisigTx = await createAsMulti(second_address, api2, appConfig, account.path)
      console.log('Final multisig transaction created:', finalMultisigTx)

      // Submit the final transaction
      return submitAndHandleTransaction(finalMultisigTx, updateMigratedStatus, api2)
    }).catch((error) => {
      console.error('Error in multisig completion:', error)
      updateMigratedStatus(TransactionStatus.ERROR, `Multisig completion failed: ${error.message}`)
      throw error
    })

      return { txPromise: completeTxPromise }
    }, InternalErrors.UNKNOWN_ERROR)
  },

  clearConnection() {
    ledgerService.clearConnection()
  },

  disconnect() {
    ledgerService.disconnect()
  },
}
