import { merkleizeMetadata } from '@polkadot-api/merkleize-metadata'
import { ApiPromise, WsProvider } from '@polkadot/api'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { GenericExtrinsicPayload } from '@polkadot/types'
import { Option } from '@polkadot/types-codec'
import { Hash, OpaqueMetadata } from '@polkadot/types/interfaces'
import { ExtrinsicPayloadValue, ISubmittableResult } from '@polkadot/types/types/extrinsic'
import { hexToU8a } from '@polkadot/util'
import { GenericeResponseAddress } from '@zondax/ledger-substrate/dist/common'
import { AppConfig } from 'config/apps'
import { errorDetails } from 'config/errors'
import { errorAddresses, MINIMUM_AMOUNT, mockBalances } from 'config/mockData'
import { Address, Balance, Collection, NftsInfo, TransactionStatus } from 'state/types/ledger'

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

export const getBip44Path = (bip44Path: string, index: number) => bip44Path.replace(/\/0'$/, `/${index}'`)

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
      if (errorAddresses.includes(addressString)) {
        throw new Error('Error fetching balance')
      }
    }

    // Get native balance
    const nativeBalance = await getNativeBalance(addressString, api)

    // Get Uniques if available
    const { nfts: uniquesNfts, collections: uniquesCollections } = await getUniquesOwnedByAccount(address, api)

    // Get NFTs if available
    const { nfts, collections } = await getNFTsOwnedByAccount(address, api)

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
 * Prepares a transaction by:
 * 1. Getting the sender's nonce
 * 2. Retrieving and merkleizing metadata
 * 3. Creating the transfer extrinsic
 * 4. Building the payload for signing
 * 5. Generating the merkle proof
 */
export async function prepareTransaction(api: ApiPromise, senderAddress: string, receiverAddress: string, appConfig: AppConfig) {
  const nonceResp = await api.query.system.account(senderAddress)
  const { nonce } = nonceResp.toHuman() as any

  const metadataV15 = await api.call.metadata.metadataAtVersion<Option<OpaqueMetadata>>(15).then(m => {
    if (!m.isNone) {
      return m.unwrap()
    }
  })
  if (!metadataV15) return

  const merkleizedMetadata = merkleizeMetadata(metadataV15, {
    decimals: appConfig.decimals,
    tokenSymbol: appConfig.ticker,
  })

  const metadataHash = merkleizedMetadata.digest()
  const transfer = api.tx.balances.transferKeepAlive(receiverAddress, MINIMUM_AMOUNT) // TODO: Replace MINIMUM_AMOUNT by amount

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
    chainId: appConfig.ticker.toLowerCase(),
  }

  const proof1: Uint8Array = metadata.getProofForExtrinsicPayload(payloadBytes)

  return { transfer, payload, metadataHash, nonce, proof1, payloadBytes }
}

/**
 * Prepare a NFT transfer transaction
 * @param api - The API instance.
 * @param senderAddress - The sender's address.
 * @param receiverAddress - The receiver's address.
 * @param collectionId - The collection ID.
 * @param itemId - The item ID.
 * @param appConfig - The app config.
 * @param pallet - The pallet to use ('nfts' or 'uniques')
 */
export async function prepareNFTTransfer(
  api: ApiPromise,
  senderAddress: string,
  receiverAddress: string,
  collectionId: string,
  itemId: string,
  appConfig: AppConfig,
  pallet: 'nfts' | 'uniques' = 'nfts' // Default to nfts pallet
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
    decimals: appConfig.decimals,
    tokenSymbol: appConfig.ticker,
  })

  const metadataHash = merkleizedMetadata.digest()

  // Create transfer extrinsic based on the selected pallet
  const transfer =
    pallet === 'nfts'
      ? api.tx.nfts.transfer(collectionId, itemId, receiverAddress)
      : api.tx.uniques.transfer(collectionId, itemId, receiverAddress)

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
    chainId: appConfig.ticker.toLowerCase(),
  }

  const proof1: Uint8Array = metadata.getProofForExtrinsicPayload(payloadBytes)

  return { transfer, payload, metadataHash, nonce, proof1, payloadBytes }
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
      updateStatus('unknown', 'Transaction timed out, check the transaction status in the explorer.')
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
          updateStatus('inBlock', `In block: ${blockHash}`, {
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

          console.log(`Transaction finalized in block: ${blockHash}`)
          updateStatus('finalized', `Finalized in block: ${blockHash}`, {
            txHash,
            blockHash,
            blockNumber,
          })

          if (!status.txIndex) {
            updateStatus('unknown', 'The status is unknown', {
              txHash,
              blockHash,
              blockNumber,
            })
            resolve()
            return // Resolve here, as we have a final status
          }

          const result = await getTransactionDetails(api, blockHash, status.txIndex)
          if (result?.success) {
            console.log(`Transaction successful: ${txHash}, ${blockHash}, ${blockNumber}`)
            updateStatus('success', 'Successful Transaction', {
              txHash,
              blockHash,
              blockNumber,
            })
            resolve()
          } else if (result?.error) {
            updateStatus('failed', result.error, {
              txHash,
              blockHash,
              blockNumber,
            })
            reject(new Error(result.error)) // Reject with the specific error
          } else {
            // Handle cases where result is undefined or doesn't have success/error
            updateStatus('error', 'Unknown transaction status', {
              txHash,
              blockHash,
              blockNumber,
            })
            reject(new Error('Unknown transaction status'))
          }
        } else if (status.isError) {
          clearTimeout(timeoutId)
          console.error('Transaction is error ', status.dispatchError)
          updateStatus('error', 'Transaction is error')
          reject(new Error('Transaction is error'))
        } else if (status.isWarning) {
          console.log('Transaction is warning')
          updateStatus('warning', 'Transaction is warning')
        } else if (status.isCompleted) {
          console.log('Transaction is completed')
          updateStatus('completed', 'Transaction is completed')
        }
      })
      .catch((error: any) => {
        clearTimeout(timeoutId)
        console.error('Error sending transaction:', error)
        updateStatus('error', 'Error sending transaction')
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
      console.log('Transaction failed!')
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
    console.log('Transaction successful!')
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
      console.log('Disconnecting API...')
      await api.disconnect()
    }

    // Then disconnect the provider if it exists
    if (provider) {
      console.log('Disconnecting WebSocket provider...')
      await provider.disconnect()
    }

    console.log('Disconnection complete')
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
        console.log('Metadata is not in a recognizable JSON format:', mdPrimitive.data)
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
 * Gets all NFTs owned by a given address, across all collections.
 * @param address The address to check.
 * @param apiOrEndpoint An existing API instance or RPC endpoint string (required).
 * @returns An array of NFTDisplayInfo objects, or an empty array on error.
 */
export async function getNFTsOwnedByAccount(address: GenericeResponseAddress, apiOrEndpoint: string | ApiPromise): Promise<NftsInfo> {
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
          source: 'nft_info_fetch',
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

  const { address: addressString } = address
  const allNFTs: NftsInfo = { nfts: [], collections: [] }

  // Check if nfts pallet is available
  if (!apiToUse.query.nfts) {
    console.log('NFTs pallet is not available on this chain')

    // Disconnect if we created a new connection
    if (providerToDisconnect) {
      await disconnectSafely(apiToUse, providerToDisconnect)
    }

    return allNFTs
  }

  try {
    const entries = await apiToUse.query.nfts.account.entries(addressString)

    console.log(`Found ${entries.length} NFT entries for address ${addressString}`)

    const itemsInfo = entries.map(([key, _info]) => {
      const info = key.args.map(k => k.toPrimitive())
      info.shift() // first item is the address which we do not need it to fetch the item information
      return info
    })

    const itemsInformation = await Promise.all(itemsInfo.map(async itemInfo => await apiToUse!.query.nfts.item(...itemInfo)))

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
    const uniqueItems = Array.from(new Set(myItems.map(item => Number(item.ids.collectionId))))

    const metadataPromises = uniqueItems.map(collectionId => apiToUse!.query.nfts.collectionMetadataOf(collectionId))
    const metadataRequests = await Promise.all(metadataPromises)
    const collectionInfo: Promise<Collection>[] = metadataRequests.map(async (metadata, index) => {
      const collectionId = uniqueItems[index]
      return processCollectionMetadata(metadata, collectionId)
    })

    const result: NftsInfo = {
      nfts: myItems.map(item => processNftItem(item)),
      collections: await Promise.all(collectionInfo),
    }

    // Disconnect if we created a new connection
    if (providerToDisconnect) {
      await disconnectSafely(apiToUse, providerToDisconnect)
    }

    return result
  } catch (error) {
    console.error(`Error fetching NFTs for address ${addressString}:`, error)

    // Disconnect if we created a new connection
    if (providerToDisconnect) {
      await disconnectSafely(apiToUse, providerToDisconnect)
    }

    return {
      nfts: [],
      collections: [],
      error: {
        source: 'nft_info_fetch',
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
export async function getUniquesOwnedByAccount(address: GenericeResponseAddress, apiOrEndpoint: string | ApiPromise): Promise<NftsInfo> {
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
          source: 'uniques_info_fetch',
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

  const { address: addressString } = address
  const allNFTs: NftsInfo = { nfts: [], collections: [] }

  // Check if nfts pallet is available
  if (!apiToUse.query.uniques) {
    console.log('Uniques pallet is not available on this chain')

    // Disconnect if we created a new connection
    if (providerToDisconnect) {
      await disconnectSafely(apiToUse, providerToDisconnect)
    }

    return allNFTs
  }

  try {
    const entries = await apiToUse.query.uniques.account.entries(addressString)

    console.log(`Found ${entries.length} uniques entries for address ${addressString}, ${entries}}`)

    const itemsInfo = entries.map(([key, _info]) => {
      const info = key.args.map(k => k.toPrimitive())
      info.shift() // first item is the address which we do not need it to fetch the item information
      return info
    })

    const itemsInformation = await Promise.all(itemsInfo.map(async itemInfo => await apiToUse!.query.uniques.asset(...itemInfo)))

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
    const uniqueItems = Array.from(new Set(myItems.map(item => Number(item.ids.collectionId))))

    const metadataPromises = uniqueItems.map(collectionId => apiToUse!.query.uniques.classMetadataOf(collectionId))
    const metadataRequests = await Promise.all(metadataPromises)
    const collectionInfo: Promise<Collection>[] = metadataRequests.map(async (metadata, index) => {
      const collectionId = uniqueItems[index]
      return processCollectionMetadata(metadata, collectionId)
    })

    const result: NftsInfo = {
      nfts: myItems.map(item => processNftItem(item, true)),
      collections: await Promise.all(collectionInfo),
    }

    // Disconnect if we created a new connection
    if (providerToDisconnect) {
      await disconnectSafely(apiToUse, providerToDisconnect)
    }

    return result
  } catch (error) {
    console.error(`Error fetching uniques NFTs for address ${addressString}:`, error)

    // Disconnect if we created a new connection
    if (providerToDisconnect) {
      await disconnectSafely(apiToUse, providerToDisconnect)
    }

    return {
      nfts: [],
      collections: [],
      error: {
        source: 'uniques_info_fetch',
        description: `Failed to fetch NFTs: ${String(error)}`,
      },
    }
  }
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
    'https://gateway.pinata.cloud/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/',
    'https://gateway.ipfs.io/ipfs/',
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

    console.log(`Fetching IPFS content from ${httpUrl}`)

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
      console.log(`Converting direct CID ${metadataUrl} to ${ipfsUrl}`)
    } else {
      // It's already an IPFS or HTTP URL
      ipfsUrl = metadataUrl.startsWith('ipfs://') ? ipfsToHttpUrl(metadataUrl) : metadataUrl
    }

    console.log(`Fetching NFT metadata from ${ipfsUrl}`)

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
