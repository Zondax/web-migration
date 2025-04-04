import { GenericeResponseAddress } from '@zondax/ledger-substrate/dist/common'
import { AppConfig, AppId, appsConfigs } from 'config/apps'
import { maxAddressesToFetch } from 'config/config'
import { InternalErrors } from 'config/errors'

import { createSignedExtrinsic, getApiAndProvider, getBip44Path, prepareTransaction, submitAndHandleTransaction } from '@/lib/account'
import { ledgerService } from '@/lib/ledger/ledgerService'

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

  async migrateAccount(appId: AppId, account: Address, updateStatus: UpdateMigratedStatusFn): Promise<{ migrated?: boolean }> {
    const senderAddress = account.address
    const receiverAddress = account.destinationAddress
    const transferAmount = account.balance?.native
    const appConfig = appsConfigs.get(appId)

    if (!receiverAddress) {
      throw InternalErrors.NO_RECEIVER_ADDRESS
    }
    if (!transferAmount) {
      throw InternalErrors.NO_TRANSFER_AMOUNT
    }
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

      try {
        const preparedTx = await prepareTransaction(api, senderAddress, receiverAddress, appConfig)
        if (!preparedTx) {
          throw new Error('Prepare transaction failed')
        }
        const { transfer, payload, metadataHash, nonce, proof1, payloadBytes } = preparedTx

        const chainId = appConfig.ticker.toLowerCase()

        const { signature } = await ledgerService.signTransaction(account.path, payloadBytes, chainId, proof1)

        if (signature) {
          const signedExtrinsic = createSignedExtrinsic(api, transfer, senderAddress, signature, payload, nonce, metadataHash)

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
          await submitAndHandleTransaction(transfer, updateMigratedStatus, api)

          return { migrated: true }
        }
        return { migrated: false }
      } finally {
        await api.disconnect()
      }
    }, InternalErrors.UNKNOWN_ERROR)
  },

  clearConnection() {
    ledgerService.clearConnection()
  },

  disconnect() {
    ledgerService.disconnect()
  },
}
