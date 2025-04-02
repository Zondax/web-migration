import Transport from '@ledgerhq/hw-transport'
import { PolkadotGenericApp } from '@zondax/ledger-substrate'
import { GenericeResponseAddress } from '@zondax/ledger-substrate/dist/common'
import { AppId } from 'config/apps'

/**
 * Represents a response object from a connection request.
 */
export interface ConnectionResponse {
  error?: string
  connection?: DeviceConnectionProps
}

/**
 * Represents the properties of a device connection.
 */
export interface DeviceConnectionProps {
  transport?: Transport
  genericApp?: PolkadotGenericApp
  isAppOpen?: boolean
}

/**
 * Status of an address in the migration process
 */
export type AddressStatus = 'synchronized' | 'migrated'

/**
 * Status of a transaction through its lifecycle
 */
export type TransactionStatus = 'pending' | 'inBlock' | 'finalized' | 'success' | 'failed' | 'error' | 'warning' | 'unknown' | 'completed'

/**
 * Details of a blockchain transaction
 */
export interface Transaction {
  status?: TransactionStatus
  statusMessage?: string
  hash?: string
  blockHash?: string
  blockNumber?: string
}

export interface TransactionDetails {
  txHash?: string
  blockHash?: string
  blockNumber?: string
}

export type UpdateMigratedStatusFn = (
  appId: AppId,
  accountPath: string,
  status: TransactionStatus,
  message?: string,
  txDetails?: TransactionDetails
) => void

/**
 * Extended address information including balance, status and transaction details
 */
export interface Address extends GenericeResponseAddress {
  balance?: number
  status?: AddressStatus
  isLoading?: boolean
  error?: {
    source: 'migration' | 'balance_fetch'
    description: string
  }
  transaction?: Transaction
  destinationAddress?: string
  path: string
}
