import type { GenericeResponseAddress } from '@zondax/ledger-substrate/dist/common'
import { type AppConfig, type AppId, appsConfigs } from 'config/apps'
import { maxAddressesToFetch } from 'config/config'
import { InternalErrors } from 'config/errors'

import { MINIMUM_AMOUNT } from '@/config/mockData'
import {
  type UpdateTransactionStatus,
  createSignedExtrinsic,
  getApiAndProvider,
  prepareTransaction,
  prepareTransactionPayload,
  prepareUnstakeTransaction,
  submitAndHandleTransaction,
} from '@/lib/account'
import { ledgerService } from '@/lib/ledger/ledgerService'
import type { ConnectionResponse } from '@/lib/ledger/types'
import { hasBalance } from '@/lib/utils'
import { getBip44Path } from '@/lib/utils/address'
import { isNativeBalance, isNftBalance } from '@/lib/utils/balance'

import { type Address, BalanceType, type Nft, type TransactionStatus, type UpdateMigratedStatusFn } from '../types/ledger'
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
      const address: Address = {
        ...genericAddress,
        path: derivedPath,
      } as Address

      return { result: address }
    }, InternalErrors.SYNC_ERROR)
  },

  async migrateAccount(
    appId: AppId,
    account: Address,
    path: string,
    updateStatus: UpdateMigratedStatusFn,
    balanceIndex: number
  ): Promise<{ txPromise?: Promise<void> } | undefined> {
    const balance = account.balances?.[balanceIndex]
    if (!balance) {
      console.warn(`Balance at index ${balanceIndex} not found for account ${account.address} in app ${appId}`)
      return undefined
    }

    const senderAddress = account.address
    const receiverAddress = balance.transaction?.destinationAddress
    const hasAvailableBalance = hasBalance([balance])
    const appConfig = appsConfigs.get(appId)

    if (!receiverAddress) {
      throw InternalErrors.NO_RECEIVER_ADDRESS
    }
    if (!hasAvailableBalance) {
      throw InternalErrors.NO_TRANSFER_AMOUNT
    }
    if (!appConfig) {
      throw InternalErrors.APP_CONFIG_NOT_FOUND
    }
    if (!appConfig.rpcEndpoint) {
      throw InternalErrors.APP_CONFIG_NOT_FOUND
    }
    return withErrorHandling(async () => {
      const { api, error } = await getApiAndProvider(appConfig.rpcEndpoint ?? '')
      if (error || !api) {
        throw new Error(error ?? 'Failed to connect to the blockchain.')
      }

      // Determine which type of balance we're dealing with
      let nftsToTransfer: Nft[] = []
      let nativeAmount = undefined
      let transferebleAmount = 0

      if (isNativeBalance(balance)) {
        // For native balance, use the balance amount
        nativeAmount = balance.balance.transferable
        transferebleAmount = balance.balance.transferable
      } else if (isNftBalance(balance)) {
        // For NFT balances, add them to the transfer list
        nftsToTransfer = balance.balance
        transferebleAmount = account.balances?.find(b => b.type === BalanceType.NATIVE)?.balance.transferable ?? 0
      }

      // Use minimum amount for development if needed
      if (process.env.NEXT_PUBLIC_NODE_ENV === 'development' && MINIMUM_AMOUNT && isNativeBalance(balance)) {
        nativeAmount = MINIMUM_AMOUNT
      }

      // Prepare transaction with the specific asset type
      const preparedTx = await prepareTransaction(
        api,
        senderAddress,
        receiverAddress,
        transferebleAmount,
        nftsToTransfer,
        appConfig,
        nativeAmount
      )
      if (!preparedTx) {
        throw new Error('Prepare transaction failed')
      }
      const { transfer, payload, metadataHash, nonce, proof1, payloadBytes } = preparedTx

      const chainId = appConfig.token.symbol.toLowerCase()

      const { signature } = await ledgerService.signTransaction(path, payloadBytes, chainId, proof1)

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
          updateStatus(appConfig.id, path, balance.type, status, message, txDetails)
        }

        // Create transaction promise but don't await it
        const txPromise = submitAndHandleTransaction(transfer, updateMigratedStatus, api)

        return { txPromise }
      }
      return
    }, InternalErrors.UNKNOWN_ERROR)
  },

  async unstakeBalance(appId: AppId, address: string, path: string, amount: number, updateTxStatus: UpdateTransactionStatus) {
    const appConfig = appsConfigs.get(appId)
    if (!appConfig?.rpcEndpoint) {
      throw InternalErrors.APP_CONFIG_NOT_FOUND
    }

    return withErrorHandling(async () => {
      const { api, error } = await getApiAndProvider(appConfig.rpcEndpoint ?? '')
      if (error || !api) {
        throw new Error(error ?? 'Failed to connect to the blockchain.')
      }

      const unstakeTx = await prepareUnstakeTransaction(api, amount)

      // Prepare transaction payload
      const preparedTx = await prepareTransactionPayload(api, address, appConfig, unstakeTx)
      if (!preparedTx) {
        throw new Error('Failed to prepare transaction')
      }
      const { transfer, payload, metadataHash, nonce, proof1, payloadBytes } = preparedTx

      // Get chain ID from app config
      const chainId = appConfig.token.symbol.toLowerCase()

      // Sign transaction with Ledger
      const { signature } = await ledgerService.signTransaction(path, payloadBytes, chainId, proof1)
      if (!signature) {
        throw new Error('Failed to sign transaction')
      }

      // Create signed extrinsic
      createSignedExtrinsic(api, transfer, address, signature, payload, nonce, metadataHash)

      // Create and wait for transaction to be submitted
      await submitAndHandleTransaction(transfer, updateTxStatus, api)
    }, InternalErrors.UNKNOWN_ERROR)
  },

  clearConnection() {
    ledgerService.clearConnection()
  },

  disconnect() {
    ledgerService.disconnect()
  },
}
