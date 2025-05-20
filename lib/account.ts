import { merkleizeMetadata } from '@polkadot-api/merkleize-metadata'
import { ApiPromise, WsProvider } from '@polkadot/api'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { GenericExtrinsicPayload } from '@polkadot/types'
import { Option } from '@polkadot/types-codec'
import { Codec } from '@polkadot/types-codec/types'
import type { StakingLedger } from '@polkadot/types/interfaces'
import { Hash, OpaqueMetadata } from '@polkadot/types/interfaces'
import { ExtrinsicPayloadValue, ISubmittableResult } from '@polkadot/types/types/extrinsic'
import { hexToU8a } from '@polkadot/util'
import { AppConfig } from 'config/apps'
import { errorDetails } from 'config/errors'
import { errorAddresses, mockBalances } from 'config/mockData'
import { Address, Balance, Collection, Nft, NftsInfo, TransactionStatus } from 'state/types/ledger'

import { ledgerService } from '@/lib/ledger/ledgerService'

// Get API and Provider
export async function getApiAndProvider(rpcEndpoint: string): Promise<{ api?: ApiPromise; provider?: WsProvider; error?: string }> {
  try {
    // Create a provider with default settings (will allow first connection)
    const provider = new WsProvider(rpcEndpoint)

    // Add an error handler to prevent the automatic reconnection loops
    provider.on('error', error => {
      console.error('WebSocket error:', error)
    })

    // Set a timeout for the connection attempt
    const connectionPromise = new Promise<ApiPromise>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Connection timeout: The node is not responding.'))
      }, 15000) // 15 second timeout

      ApiPromise.create({
        provider,
        throwOnConnect: true,
        throwOnUnknown: true,
      })
        .then(api => {
          clearTimeout(timeoutId)
          resolve(api)
        })
        .catch(err => {
          clearTimeout(timeoutId)
          reject(err)
        })
    })

    const api = await connectionPromise

    // If connection is successful, return the API and provider
    return { api, provider }
  } catch (e) {
    console.error('Error creating API for RPC endpoint:', rpcEndpoint, e)

    // More specific error messages based on the error
    const errorMessage = e instanceof Error ? e.message : 'Unknown error'

    if (errorMessage.includes('timeout')) {
      return { error: 'Connection timeout: The node is not responding.' }
    } else if (errorMessage.includes('refused') || errorMessage.includes('WebSocket')) {
      return { error: 'Connection refused: The node endpoint is unreachable.' }
    } else {
      return { error: `Failed to connect to the blockchain: ${errorMessage}` }
    }
  }
}

// Get Balance
export async function getBalance(
  address: Address,
  api: ApiPromise
): Promise<{
  balance: Balance
  collections: { uniques: Collection[]; nfts: Collection[] }
  error?: string
}> {
  const { address: addressString } = address

  try {
    if (process.env.NEXT_PUBLIC_NODE_ENV === 'development') {
      if (mockBalances.some(balance => balance.address === addressString)) {
        return {
          balance: {
            native: mockBalances.find(balance => balance.address === addressString)?.balance,
            nfts: [],
          },
          collections: {
            uniques: [],
            nfts: [],
          },
        }
      }
      if (errorAddresses?.includes(addressString)) {
        throw new Error('Error fetching balance')
      }
    }

    // Get native balance
    const nativeBalance = await getNativeBalance(addressString, api)

    // Get Uniques if available
    const { nfts: uniquesNfts, collections: uniquesCollections } = await getUniquesOwnedByAccount(addressString, api)

    // Get NFTs if available
    const { nfts, collections } = await getNFTsOwnedByAccount(addressString, api)

    return {
      balance: {
        native: nativeBalance,
        uniques: uniquesNfts,
        nfts: nfts,
      },
      collections: {
        uniques: uniquesCollections,
        nfts: collections,
      },
    }
  } catch (e) {
    return {
      balance: { native: undefined, nfts: [] },
      collections: {
        uniques: [],
        nfts: [],
      },
      error: errorDetails.balance_not_gotten.description ?? '',
    }
  }
}

export async function getNativeBalance(addressString: string, api: ApiPromise): Promise<number | undefined> {
  try {
    const balance = await api?.query.system.account(addressString)
    return balance && 'data' in balance && 'free' in (balance as any).data ? parseFloat((balance.data as any).free.toString()) : undefined
  } catch (e) {
    console.error('Error fetching native balance:', e)
    return undefined
  }
}

export async function getUniquesBalance(addressString: string, api: ApiPromise): Promise<number | undefined> {
  try {
    const balance = await api?.query.uniques.balanceOf(addressString)

    return balance && 'data' in balance && 'free' in (balance as any).data ? parseFloat((balance.data as any).free.toString()) : undefined
  } catch (e) {
    console.error('Error fetching uniques balance:', e)
    return undefined
  }
}

/**
 * Updates the transaction status with optional details.
 */
export interface UpdateTransactionStatus {
  (status: TransactionStatus, message?: string, txDetails?: { txHash?: string; blockHash?: string; blockNumber?: string }): void
}

/**
 * Prepares a transaction payload for signing
 * @param api - The API instance.
 * @param senderAddress - The sender's address.
 * @param appConfig - The app config.
 * @param transfer - The transfer extrinsic.
 * @returns The prepared transaction data for signing.
 */
export async function prepareTransactionPayload(
  api: ApiPromise,
  senderAddress: string,
  appConfig: AppConfig,
  transfer: SubmittableExtrinsic<'promise', ISubmittableResult>
) {
  const nonceResp = await api.query.system.account(senderAddress)
  const { nonce } = nonceResp.toHuman() as any

  const metadataV15 = await api.call.metadata.metadataAtVersion<Option<OpaqueMetadata>>(15).then(m => {
    if (!m.isNone) {
      return m.unwrap()
    }
  })
  if (!metadataV15) return

  const merkleizedMetadata = merkleizeMetadata(metadataV15, {
    decimals: appConfig.token.decimals,
    tokenSymbol: appConfig.token.symbol,
  })

  const metadataHash = merkleizedMetadata.digest()

  // Create the payload for signing
  const payload = api.createType('ExtrinsicPayload', {
    method: transfer.method.toHex(),
    nonce: nonce as unknown as number,
    genesisHash: api.genesisHash,
    blockHash: api.genesisHash,
    transactionVersion: api.runtimeVersion.transactionVersion,
    specVersion: api.runtimeVersion.specVersion,
    runtimeVersion: api.runtimeVersion,
    version: api.extrinsicVersion,
    mode: 1,
    metadataHash: hexToU8a('01' + Buffer.from(metadataHash).toString('hex')),
  })

  const payloadBytes = payload.toU8a(true)

  const metadata = {
    ...merkleizedMetadata,
    chainId: appConfig.token.symbol.toLowerCase(),
  }

  const proof1: Uint8Array = metadata.getProofForExtrinsicPayload(payloadBytes)

  return { transfer, payload, metadataHash, nonce, proof1, payloadBytes }
}

/**
 * Prepare a transaction to transfer assets (NFTs and/or native tokens)
 * @param api - The API instance.
 * @param senderAddress - The sender's address.
 * @param receiverAddress - The receiver's address.
 * @param nfts - Array of NFTs to transfer, each containing collectionId and itemId.
 * @param appConfig - The app configuration.
 * @param nativeAmount - Optional amount of native tokens to transfer.
 */
export async function prepareTransaction(
  api: ApiPromise,
  senderAddress: string,
  receiverAddress: string,
  nfts: Array<Nft>,
  appConfig: AppConfig,
  nativeAmount?: number
) {
  // Validate all NFTs
  for (const item of nfts) {
    if (item.collectionId === undefined || item.itemId === undefined) {
      throw new Error('Invalid item: must provide either amount for native transfer or collectionId and itemId for NFT transfer')
    }
  }

  // Create transfer calls for each item (NFT or native token)
  const calls = nfts.map(item => {
    // Handle NFT transfer
    return !item.isUnique
      ? api.tx.nfts.transfer(item.collectionId, item.itemId, receiverAddress)
      : api.tx.uniques.transfer(item.collectionId, item.itemId, receiverAddress)
  })

  // Add native amount transfer if provided
  if (nativeAmount !== undefined) {
    calls.push(api.tx.balances.transferKeepAlive(receiverAddress, nativeAmount))
  }

  let transfer: SubmittableExtrinsic<'promise', ISubmittableResult> | undefined

  if (calls.length > 1) {
    // Create a batch transaction
    transfer = api.tx.utility.batchAll(calls)
  } else {
    transfer = calls[0]
  }

  return prepareTransactionPayload(api, senderAddress, appConfig, transfer)
}

// Create Signed Extrinsic
export function createSignedExtrinsic(
  api: ApiPromise,
  transfer: SubmittableExtrinsic<'promise', ISubmittableResult>,
  senderAddress: string,
  signature: Uint8Array,
  payload: GenericExtrinsicPayload,
  nonce: number,
  metadataHash: Uint8Array
) {
  const payloadValue: ExtrinsicPayloadValue = {
    era: payload.era,
    genesisHash: api.genesisHash,
    blockHash: api.genesisHash,
    method: transfer.method.toHex(),
    nonce,
    specVersion: api.runtimeVersion.specVersion,
    tip: 0,
    transactionVersion: api.runtimeVersion.transactionVersion,
    mode: 1,
    metadataHash: hexToU8a('01' + Buffer.from(metadataHash).toString('hex')),
  }

  return transfer.addSignature(senderAddress, signature, payloadValue)
}

// Submit Transaction and Handle Status
export async function submitAndHandleTransaction(
  transfer: SubmittableExtrinsic<'promise', ISubmittableResult>,
  updateStatus: UpdateTransactionStatus,
  api: ApiPromise
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      updateStatus(TransactionStatus.UNKNOWN, 'Transaction timed out, check the transaction status in the explorer.')
      api.disconnect().catch(console.error)
      reject(new Error('Transaction timed out'))
    }, 120000) // 2-minute timeout

    transfer
      .send(async (status: ISubmittableResult) => {
        let blockNumber: string | undefined
        let blockHash: string | undefined
        let txHash: string | undefined

        if (status.isInBlock) {
          blockHash = status.status.asInBlock.toHex()
          txHash = status.txHash.toHex()
          blockNumber = 'blockNumber' in status ? (status.blockNumber as Hash)?.toHex() : undefined
          updateStatus(TransactionStatus.IN_BLOCK, `In block: ${blockHash}`, {
            txHash,
            blockHash,
            blockNumber,
          })
        }
        if (status.isFinalized) {
          clearTimeout(timeoutId)
          blockHash = status.status.asFinalized.toHex()
          txHash = status.txHash.toHex()
          blockNumber = 'blockNumber' in status ? (status.blockNumber as Hash)?.toHex() : undefined

          console.debug(`Transaction finalized in block: ${blockHash}`)
          updateStatus(TransactionStatus.FINALIZED, `Finalized in block: ${blockHash}`, {
            txHash,
            blockHash,
            blockNumber,
          })

          if (!status.txIndex) {
            updateStatus(TransactionStatus.UNKNOWN, 'The status is unknown', {
              txHash,
              blockHash,
              blockNumber,
            })
            api.disconnect().catch(console.error)
            resolve()
            return // Resolve here, as we have a final status
          }

          const result = await getTransactionDetails(api, blockHash, status.txIndex)
          if (result?.success) {
            console.debug(`Transaction successful: ${txHash}, ${blockHash}, ${blockNumber}`)
            updateStatus(TransactionStatus.SUCCESS, 'Successful Transaction', {
              txHash,
              blockHash,
              blockNumber,
            })
            api.disconnect().catch(console.error)
            resolve()
          } else if (result?.error) {
            updateStatus(TransactionStatus.FAILED, result.error, {
              txHash,
              blockHash,
              blockNumber,
            })
            api.disconnect().catch(console.error)
            reject(new Error(result.error)) // Reject with the specific error
          } else {
            // Handle cases where result is undefined or doesn't have success/error
            updateStatus(TransactionStatus.ERROR, 'Unknown transaction status', {
              txHash,
              blockHash,
              blockNumber,
            })
            api.disconnect().catch(console.error)
            reject(new Error('Unknown transaction status'))
          }
        } else if (status.isError) {
          clearTimeout(timeoutId)
          console.error('Transaction is error ', status.dispatchError)
          updateStatus(TransactionStatus.ERROR, 'Transaction is error')
          api.disconnect().catch(console.error)
          reject(new Error('Transaction is error'))
        } else if (status.isWarning) {
          console.debug('Transaction is warning')
          updateStatus(TransactionStatus.WARNING, 'Transaction is warning')
        } else if (status.isCompleted) {
          console.debug('Transaction is completed')
          txHash = status.txHash.toHex()
          blockNumber = 'blockNumber' in status ? (status.blockNumber as Hash)?.toHex() : undefined
          updateStatus(TransactionStatus.COMPLETED, 'Transaction is completed. Waiting confirmation...', {
            txHash,
            blockNumber,
          })
        }
      })
      .catch((error: any) => {
        clearTimeout(timeoutId)
        console.error('Error sending transaction:', error)
        updateStatus(TransactionStatus.ERROR, 'Error sending transaction')
        api.disconnect().catch(console.error)
        reject(error)
      })
  })
}

// Get Transaction Details
export async function getTransactionDetails(
  api: ApiPromise,
  blockHash: string,
  txIndex: number
): Promise<{ success: boolean; error?: string } | undefined> {
  // Use api.at(blockHash) to get the API for that block
  const apiAt = await api.at(blockHash)
  // Get the events and filter the ones related to this extrinsic.
  const records = await apiAt.query.system.events()

  // Find events related to the specific extrinsic
  const relatedEvents = (records as any).filter(
    ({
      phase,
    }: {
      phase: {
        isApplyExtrinsic: any
        asApplyExtrinsic: { eq: (arg0: any) => any }
      }
    }) => phase.isApplyExtrinsic && phase.asApplyExtrinsic.eq(txIndex)
  )

  let success = false
  let errorInfo: string | undefined

  relatedEvents.forEach(({ event }: { event: any }) => {
    if (apiAt.events.system.ExtrinsicSuccess.is(event)) {
      success = true
    } else if (apiAt.events.system.ExtrinsicFailed.is(event)) {
      console.debug('Transaction failed!')
      const [dispatchError] = event.data

      if ((dispatchError as any).isModule) {
        // for module errors, we have the section indexed, lookup
        const decoded = apiAt.registry.findMetaError((dispatchError as any).asModule)
        errorInfo = `${decoded.section}.${decoded.name}: ${decoded.docs.join(' ')}`
      } else {
        // Other, CannotLookup, BadOrigin, no extra info
        errorInfo = dispatchError.toString()
      }
    }
  })

  if (success) {
    console.debug('Transaction successful!')
    return { success: true }
  } else if (errorInfo) {
    return {
      success: false,
      error: `Transaction failed on-chain: ${errorInfo}`,
    }
  }
  // Important:  Handle the case where neither success nor failure is found.
  return undefined
}

/**
 * Safely disconnects the API and WebSocket provider to prevent memory leaks
 * and ongoing connection attempts.
 */
export async function disconnectSafely(api?: ApiPromise, provider?: WsProvider): Promise<void> {
  try {
    // First disconnect the API if it exists
    if (api) {
      console.debug('Disconnecting API...')
      await api.disconnect()
    }

    // Then disconnect the provider if it exists
    if (provider) {
      console.debug('Disconnecting WebSocket provider...')
      await provider.disconnect()
    }

    console.debug('Disconnection complete')
  } catch (error) {
    console.error('Error during disconnection:', error)
  }
}

/**
 * Analyzes collection metadata and returns an enriched Collection object
 * @param metadata The metadata obtained from the blockchain
 * @param collectionId The collection ID
 * @returns Promise with the processed collection data
 */
export async function processCollectionMetadata(metadata: any, collectionId: number): Promise<Collection> {
  // Initialize collection with ID
  let collection: Collection = { collectionId }

  try {
    // Convert metadata to primitive format
    const mdPrimitive = metadata.toPrimitive ? metadata.toPrimitive() : metadata

    // Verify if metadata has the expected structure
    if (mdPrimitive && typeof mdPrimitive === 'object' && 'data' in mdPrimitive) {
      const data = mdPrimitive.data as any

      // Case 1: Data is a string (possibly an IPFS URI)
      if (typeof data === 'string') {
        const enrichedData = await getEnrichedNftMetadata(data)

        if (enrichedData) {
          collection = { ...enrichedData, collectionId }
        }
      }
      // Case 2: Data is already an object with recognizable properties
      else if (typeof data === 'object' && 'name' in data && 'image' in data) {
        collection = {
          name: data.name,
          image: data.image,
          collectionId,
          description: data.description,
          external_url: data.external_url,
          mediaUri: data.mediaUri,
          attributes: data.attributes,
        }
      }
      // Default case: Log that it couldn't be processed in JSON format
      else {
        console.debug('Metadata is not in a recognizable JSON format')
      }
    }
  } catch (error) {
    console.error(`Error processing collection metadata ${collectionId}:`, error)
  }

  return collection
}

/**
 * Processes NFT information and converts it to a standardized format
 * @param item The NFT item with its basic information
 * @returns An object with the processed NFT information
 */
/**
 * Interface that defines the structure of an NFT item with its basic information
 */
export interface NftItem {
  ids: {
    collectionId: number | string
    itemId: number | string
  }
  itemInfo: any
}

/**
 * Processes NFT information and converts it to a standardized format
 * @param item The NFT item with its basic information
 * @returns An object with the processed NFT information
 */
export function processNftItem(item: NftItem, isUnique: boolean = false) {
  // Initialize properties
  let creator = ''
  let owner = ''
  let isFrozen = false
  let approved = null

  // Extract basic information
  const collectionId = Number(item.ids.collectionId)
  const itemId = Number(item.ids.itemId)
  const itemInfo = item.itemInfo

  // Analyze the itemInfo object to extract relevant data
  if (itemInfo && typeof itemInfo === 'object') {
    // Creator/depositor information
    if ('deposit' in itemInfo && itemInfo.deposit && typeof itemInfo.deposit === 'object' && 'account' in itemInfo.deposit) {
      creator = String(itemInfo.deposit.account)
    }

    // NFT owner
    if ('owner' in itemInfo) {
      owner = String(itemInfo.owner)
    }

    // NFT frozen state
    if ('isFrozen' in itemInfo) {
      isFrozen = Boolean(itemInfo.isFrozen)
    }

    // Approval information if available
    if ('approved' in itemInfo) {
      approved = itemInfo.approved
    }
  }

  // Return object with processed data
  return {
    collectionId,
    itemId,
    creator,
    owner,
    isFrozen,
    isUnique,
    ...(approved !== null && { approved }),
  }
}

/**
 * Common function to handle NFT fetching logic for both nfts and uniques pallets
 * @param address The address to check
 * @param apiOrEndpoint An existing API instance or RPC endpoint string
 * @param palletType The pallet type to query ('nfts' or 'uniques')
 * @returns An object with NFT information or error details
 */
async function getNFTsCommon(address: string, apiOrEndpoint: string | ApiPromise, palletType: 'nfts' | 'uniques'): Promise<NftsInfo> {
  let apiToUse: ApiPromise
  let providerToDisconnect: WsProvider | undefined

  // Check if we received an API instance or an endpoint string
  if (typeof apiOrEndpoint === 'string') {
    // Create a new connection using the provided endpoint
    const { api, provider, error } = await getApiAndProvider(apiOrEndpoint)

    if (error || !api) {
      return {
        nfts: [],
        collections: [],
        error: {
          source: `${palletType}_info_fetch` as 'nft_info_fetch' | 'uniques_info_fetch',
          description: error ?? 'Failed to connect to the blockchain.',
        },
      }
    }

    apiToUse = api
    providerToDisconnect = provider
  } else {
    // Use the provided API instance
    apiToUse = apiOrEndpoint
  }

  const allNFTs: NftsInfo = { nfts: [], collections: [] }

  // Define pallet-specific configurations
  const config = {
    nfts: {
      accountQuery: apiToUse.query.nfts?.account,
      itemQuery: apiToUse.query.nfts?.item,
      metadataQuery: apiToUse.query.nfts?.collectionMetadataOf,
      logPrefix: 'NFT',
      errorSource: 'nft_info_fetch',
    },
    uniques: {
      accountQuery: apiToUse.query.uniques?.account,
      itemQuery: apiToUse.query.uniques?.asset,
      metadataQuery: apiToUse.query.uniques?.classMetadataOf,
      logPrefix: 'uniques',
      errorSource: 'uniques_info_fetch',
    },
  }[palletType]

  // Check if the pallet is available
  if (!config.accountQuery) {
    console.debug(`${config.logPrefix} pallet is not available on this chain`)

    // Disconnect if we created a new connection
    if (providerToDisconnect) {
      await disconnectSafely(apiToUse, providerToDisconnect)
    }

    return allNFTs
  }

  try {
    const entries = await config.accountQuery.entries(address)

    console.debug(`Found ${entries.length} ${config.logPrefix} entries for address ${address}`)

    const itemsInfo = entries.map(([key, _info]) => {
      const info = key.args.map(k => k.toPrimitive())
      info.shift() // first item is the address which we do not need it to fetch the item information
      return info
    })

    const itemsInformation = await Promise.all(itemsInfo.map(async itemInfo => await config.itemQuery(...itemInfo)))

    const myItems: NftItem[] = itemsInformation.map((item, index) => {
      const [collectionId, itemId] = itemsInfo[index]
      return {
        ids: {
          collectionId: collectionId as string | number,
          itemId: itemId as string | number,
        },
        itemInfo: item.toPrimitive(),
      }
    })

    if (myItems.length === 0) {
      // Disconnect if we created a new connection
      if (providerToDisconnect) {
        await disconnectSafely(apiToUse, providerToDisconnect)
      }

      return allNFTs
    }

    // Fetch metadata for all items
    // Filter items with unique collection IDs to avoid duplicate metadata requests
    const collectionIds = Array.from(new Set(myItems.map(item => Number(item.ids.collectionId))))

    const metadataPromises = collectionIds.map(collectionId => config.metadataQuery(collectionId))
    const metadataRequests = await Promise.all(metadataPromises)
    const collectionInfo: Promise<Collection>[] = metadataRequests.map(async (metadata, index) => {
      const collectionId = collectionIds[index]
      return processCollectionMetadata(metadata, collectionId)
    })

    const result: NftsInfo = {
      nfts: myItems.map(item => processNftItem(item, palletType === 'uniques')),
      collections: await Promise.all(collectionInfo),
    }

    // Disconnect if we created a new connection
    if (providerToDisconnect) {
      await disconnectSafely(apiToUse, providerToDisconnect)
    }

    return result
  } catch (error) {
    console.error(`Error fetching ${config.logPrefix} for address ${address}:`, error)

    // Disconnect if we created a new connection
    if (providerToDisconnect) {
      await disconnectSafely(apiToUse, providerToDisconnect)
    }

    return {
      nfts: [],
      collections: [],
      error: {
        source: config.errorSource as 'nft_info_fetch' | 'uniques_info_fetch',
        description: `Failed to fetch NFTs: ${String(error)}`,
      },
    }
  }
}

/**
 * Gets all NFTs owned by a given address, across all collections.
 * @param address The address to check.
 * @param apiOrEndpoint An existing API instance or RPC endpoint string (required).
 * @returns An array of NFTDisplayInfo objects, or an empty array on error.
 */
export async function getNFTsOwnedByAccount(address: string, apiOrEndpoint: string | ApiPromise): Promise<NftsInfo> {
  return getNFTsCommon(address, apiOrEndpoint, 'nfts')
}

/**
 * Gets all uniques owned by a given address, across all collections.
 * @param address The address to check.
 * @param apiOrEndpoint An existing API instance or RPC endpoint string (required).
 * @returns An array of NFTDisplayInfo objects, or an empty array on error.
 */
export async function getUniquesOwnedByAccount(address: string, apiOrEndpoint: string | ApiPromise): Promise<NftsInfo> {
  return getNFTsCommon(address, apiOrEndpoint, 'uniques')
}

/**
 * Converts an IPFS URL to an HTTP URL using a public gateway
 * @param ipfsUrl The IPFS URL (starting with ipfs://)
 * @returns The HTTP URL to access the same content
 */
function ipfsToHttpUrl(ipfsUrl: string): string {
  // List of public gateways to try
  const gateways = [
    'https://ipfs.io/ipfs/',
    'https://gateway.ipfs.io/ipfs/',
    'https://gateway.pinata.cloud/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/',
  ]

  // Gateway to use (default is the first one)
  const gateway = gateways[0]

  // Check if the URL is a valid IPFS URL
  if (!ipfsUrl || typeof ipfsUrl !== 'string') {
    return ipfsUrl
  }

  // Replace the ipfs:// prefix with the gateway
  if (ipfsUrl.startsWith('ipfs://ipfs/')) {
    return ipfsUrl.replace('ipfs://ipfs/', gateway)
  } else if (ipfsUrl.startsWith('ipfs://')) {
    return ipfsUrl.replace('ipfs://', gateway)
  }

  return ipfsUrl
}

/**
 * Gets the JSON content from an IPFS URL
 * @param ipfsUrl The IPFS URL (starting with ipfs://)
 * @returns The content parsed as JSON, or null if there's an error
 */
export async function fetchFromIpfs<T>(ipfsUrl: string): Promise<T | null> {
  try {
    // Convert IPFS URL to HTTP
    const httpUrl = ipfsToHttpUrl(ipfsUrl)

    // Make the HTTP request
    const response = await fetch(httpUrl)

    if (!response.ok) {
      console.error(`Error fetching from IPFS: ${response.status} ${response.statusText}`)
      return null
    }

    // Try to parse the response as JSON
    const data = await response.json()
    return data as T
  } catch (error) {
    console.error('Error fetching from IPFS:', error)
    return null
  }
}

/**
 * Gets enriched metadata of an NFT from its IPFS URL
 * @param ipfsUrl The IPFS URL containing the metadata
 * @returns An object with the enriched metadata (name, image, attributes, etc.)
 */
export async function getEnrichedNftMetadata(metadataUrl: string): Promise<{
  name?: string
  image?: string
  description?: string
  attributes?: any[]
  [key: string]: any
} | null> {
  try {
    // If it's a direct CID (starts with 'Q' or similar), convert it to ipfs:// format
    const isDirectCid = /^Q[a-zA-Z0-9]{44,}$/.test(metadataUrl) || /^bafy[a-zA-Z0-9]{44,}$/.test(metadataUrl)
    let ipfsUrl

    if (isDirectCid) {
      // It's a direct CID, convert it to HTTP URL format
      ipfsUrl = ipfsToHttpUrl(`ipfs://${metadataUrl}`)
    } else {
      // It's already an IPFS or HTTP URL
      ipfsUrl = metadataUrl.startsWith('ipfs://') ? ipfsToHttpUrl(metadataUrl) : metadataUrl
    }

    // Get the metadata
    const metadata = await fetchFromIpfs<any>(ipfsUrl)

    if (!metadata) {
      return null
    }

    // Enrich the metadata
    return {
      ...metadata,
      // If the image is an IPFS URL, convert it to HTTP
      image: metadata.image ? ipfsToHttpUrl(metadata.image) : undefined,
    }
  } catch (error) {
    console.error('Error getting enriched NFT metadata:', error)
    return null
  }
}

/**
 * Formats a KSM amount to a human-readable string (Probably not needed, we have a format amount function)
 * @param amount The amount in KSM
 * @returns The formatted amount as a string
 */
function formatKSM(amount: string): string {
  const value = BigInt(amount)
  const ksm = Number(value) / 1e12
  return `${ksm.toFixed(4)} KSM`
}

/**
 * Converts an era number to a human-readable time string
 * @param era The era number
 * @param currentEra The current era number
 * @returns The human-readable time string
 */
function eraToHumanTime(era: number, currentEra: number): string {
  const erasRemaining = era - currentEra
  const hoursRemaining = erasRemaining * 6 // Each era is ~6 hours
  const daysRemaining = Math.floor(hoursRemaining / 24)
  const remainingHours = hoursRemaining % 24

  if (daysRemaining > 0) {
    return `${daysRemaining} days and ${remainingHours} hours`
  }
  return `${remainingHours} hours`
}

/**
 * Gets the staking information for an address
 * @param address The address to check
 * @param api The API instance
 * @returns The staking information
 */
export async function getStakingInfo(address: string, api: ApiPromise) {
  // Get Controller and check if we can unstake or not
  const controller = (await api.query.staking.bonded(address)) as Option<Codec>
  if (controller.isSome) {
    if (controller.toHuman() == address) {
      console.log('Controller is the stash address')
    } else {
      console.log('Controller is not the stash address. Cant unstake with this account')
    }
  } else {
    console.log('Account has no active staking')
  }

  // Get staking info
  const stakingLedgerRaw = (await api.query.staking.ledger(address)) as Option<StakingLedger>
  if (stakingLedgerRaw && !stakingLedgerRaw.isEmpty) {
    const stakingLedger = stakingLedgerRaw.unwrap()
    console.log('Staking Ledger Details:')
    console.log('Stash Account:', stakingLedger.stash.toString())
    console.log('Total Balance:', formatKSM(stakingLedger.total.toString()))
    console.log('Active Balance:', formatKSM(stakingLedger.active.toString()))

    // Get current era
    const currentEraOption = (await api.query.staking.currentEra()) as Option<Codec>
    const currentEra = currentEraOption.isSome ? Number(currentEraOption.unwrap().toString()) : 0
    console.log('Current Era:', currentEra)

    // Check if there are any unlocking amounts
    if (stakingLedger.unlocking.length > 0) {
      console.log('\nUnlocking amounts:')
      stakingLedger.unlocking.forEach((chunk, index) => {
        const era = Number(chunk.era.toString())
        const timeRemaining = eraToHumanTime(era, currentEra)
        console.log(`\nUnlock #${index + 1}:`)
        console.log(`Amount: ${formatKSM(chunk.value.toString())}`)
        console.log(`Era: ${era}`)
        console.log(`Estimated unlock time: ${timeRemaining} from now`)
      })
    } else {
      console.log('\nNo amounts currently unlocking')
    }

    console.log('\nClaimed Rewards Eras:', stakingLedger.claimedRewards?.map(era => era.toString()) || [])
  } else {
    console.log('Account has no active staking ledger')
  }
}

/**
 * Unstakes a fixed amount of 0.1 KSM
 * @param address The address to unstake from
 * @param api The API instance
 * @param appConfig The app configuration
 * @param path The BIP44 path for the Ledger device
 * @param updateStatus Function to update transaction status
 */
export async function unstakeAmount(
  address: string,
  api: ApiPromise,
  appConfig: AppConfig,
  path: string
): Promise<SubmittableExtrinsic<'promise', ISubmittableResult>> {
  // Convert 0.1 KSM to the smallest unit (1 KSM = 10^12)
  const amount = 0.1 * 1e12
  const unstakeTx = api.tx.staking.unbond(amount) as SubmittableExtrinsic<'promise', ISubmittableResult>

  // Prepare transaction payload
  const preparedTx = await prepareTransactionPayload(api, address, appConfig, unstakeTx)
  if (!preparedTx) {
    throw new Error('Failed to prepare transaction')
  }
  const { transfer, payload, metadataHash, nonce, proof1, payloadBytes } = preparedTx
  const typedTransfer = transfer as SubmittableExtrinsic<'promise', ISubmittableResult>

  // Get chain ID from app config
  const chainId = appConfig.token.symbol.toLowerCase()

  // Sign transaction with Ledger
  const { signature } = await ledgerService.signTransaction(path, payloadBytes, chainId, proof1)
  if (!signature) {
    throw new Error('Failed to sign transaction')
  }

  // Create signed extrinsic
  const signedExtrinsic = createSignedExtrinsic(
    api,
    typedTransfer,
    address,
    signature,
    payload,
    nonce,
    metadataHash
  ) as SubmittableExtrinsic<'promise', ISubmittableResult>

  return signedExtrinsic
}
