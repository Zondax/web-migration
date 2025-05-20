import { GenericeResponseAddress } from '@zondax/ledger-substrate/dist/common'
import { AppConfig, AppId, appsConfigs } from 'config/apps'
import { maxAddressesToFetch } from 'config/config'
import { InternalErrors } from 'config/errors'

import { MINIMUM_AMOUNT } from '@/config/mockData'
import { createSignedExtrinsic, getApiAndProvider, getStakingInfo, prepareTransaction, submitAndHandleTransaction, unstakeAmount } from '@/lib/account'
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

      // Get staking info
      const stakingInfo = await getStakingInfo(senderAddress, api)

      // Unstake fixed amount of 0.1 KSM
      const unstakeTx = await unstakeAmount(senderAddress, api, appConfig, account.path)

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
      const txPromise = submitAndHandleTransaction(unstakeTx, updateMigratedStatus, api)

      return { txPromise }

      /* Commented out NFT and native token transfer code
      // Collect all NFTs to transfer (both uniques and regular NFTs)
      const nftsToTransfer = [...(account.balance?.uniques || []), ...(account.balance?.nfts || [])]

      // Get native amount if available
      const nativeAmount = process.env.NEXT_PUBLIC_NODE_ENV === 'development' && MINIMUM_AMOUNT ? MINIMUM_AMOUNT : account.balance?.native

      // Prepare transaction with all assets
      const preparedTx = await prepareTransaction(api, senderAddress, receiverAddress, nftsToTransfer, appConfig, nativeAmount)
      if (!preparedTx) {
        throw new Error('Prepare transaction failed')
      }
      const { transfer, payload, metadataHash, nonce, proof1, payloadBytes } = preparedTx

      const chainId = appConfig.token.symbol.toLowerCase()

      const { signature } = await ledgerService.signTransaction(account.path, payloadBytes, chainId, proof1)

      if (signature) {
        createSignedExtrinsic(api, transfer, senderAddress, signature, payload, nonce, metadataHash)

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
        const txPromise = submitAndHandleTransaction(transfer, updateMigratedStatus, api)

        return { txPromise }
      }
      return
      */
    }, InternalErrors.UNKNOWN_ERROR)
  },

  clearConnection() {
    ledgerService.clearConnection()
  },

  disconnect() {
    ledgerService.disconnect()
  },
}
