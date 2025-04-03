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
 * Balance information for an account
 */
export interface Balance {
  native?: number
  nfts?: Nft[]
  uniques?: Nft[]
}

/**
 * Extended address information including balance, status and transaction details
 */
export interface Address extends GenericeResponseAddress {
  balance?: Balance
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
