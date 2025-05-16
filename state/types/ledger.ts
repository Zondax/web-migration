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
export enum AddressStatus {
  SYNCHRONIZED = 'synchronized',
  MIGRATED = 'migrated',
}

/**
 * Status of a transaction through its lifecycle
 */
export enum TransactionStatus {
  IS_LOADING = 'isLoading',
  PENDING = 'pending',
  IN_BLOCK = 'inBlock',
  FINALIZED = 'finalized',
  SUCCESS = 'success',
  FAILED = 'failed',
  ERROR = 'error',
  WARNING = 'warning',
  UNKNOWN = 'unknown',
  COMPLETED = 'completed',
}

/**
 * Details of a blockchain transaction
 */
export interface Transaction {
  status?: TransactionStatus
  statusMessage?: string
  hash?: string
  blockHash?: string
  blockNumber?: string
  destinationAddress?: string
}

export interface TransactionDetails {
  txHash?: string
  blockHash?: string
  blockNumber?: string
}

/**
 * Types of balances that can be migrated
 */
export enum BalanceType {
  NATIVE = 'native',
  UNIQUE = 'unique',
  NFT = 'nft',
}

export type UpdateMigratedStatusFn = (
  appId: AppId,
  accountPath: string,
  type: BalanceType,
  status: TransactionStatus,
  message?: string,
  txDetails?: TransactionDetails
) => void

/**
 * Balance information for an account
 */
export interface NativeBalance {
  type: BalanceType.NATIVE
  balance: number
  transaction?: Transaction
}

/**
 * Balance information for an account
 */
export interface NftBalance {
  type: BalanceType.UNIQUE | BalanceType.NFT
  balance: Nft[]
  transaction?: Transaction
}

/**
 * Union type for all balance types
 */
export type AddressBalance = NativeBalance | NftBalance

/**
 * Extended address information including balance, status and transaction details
 */
export interface Address extends GenericeResponseAddress {
  balances?: AddressBalance[]
  status?: AddressStatus
  isLoading?: boolean
  error?: {
    source: 'migration' | 'balance_fetch'
    description: string
  }
  path: string
}

/**
 * Essential NFT Information
 */
export interface Nft {
  collectionId: number | string
  itemId: number | string
  creator: string
  owner: string
  isUnique?: boolean
  isFrozen?: boolean
}

/**
 * Information about an NFT collection
 */
export interface Collection {
  collectionId: number
  owner?: string
  items?: number
  name?: string
  image?: string
  description?: string
  external_url?: string
  mediaUri?: string
  attributes?: {
    trait_type: string
    value: string
  }[]
  error?: {
    source: 'collection_info_fetch'
    description: string
  }
}

/**
 * All NFTs owned by an address
 */
export interface NftsInfo {
  nfts: Nft[]
  collections: Collection[]
  error?: {
    source: 'nft_info_fetch' | 'uniques_info_fetch'
    description: string
  }
}
