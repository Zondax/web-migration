import { ApiPromise } from '@polkadot/api'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { errorDetails } from '@/config/errors'

import { prepareTransaction } from '../account'
import { mockAppConfig as importedMockAppConfig, mockApi, mockMethod, mockNft1, mockNft2 } from './utils/__mocks__/mockData'

vi.mock('@polkadot-api/merkleize-metadata', () => ({
  merkleizeMetadata: vi.fn(() => ({
    digest: () => 'mockDigest',
    getProofForExtrinsicPayload: () => new Uint8Array([1, 2, 3]),
  })),
}))

// Mocks
const mockNFTs = [{ ...mockNft1 }, { ...mockNft2, isUnique: true }]
const mockSender = 'sender'
const mockReceiver = 'receiver'

// Use imported mockAppConfig
const mockAppConfig = importedMockAppConfig

describe('prepareTransaction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockApi.query.system.account = vi.fn(() => ({
      toHuman: () => ({ nonce: 0 }),
    }))
    mockApi.call = {
      metadata: {
        metadataAtVersion: vi.fn().mockResolvedValue({
          isNone: false,
          unwrap: () => ({
            digest: () => 'mockDigest',
            getProofForExtrinsicPayload: () => new Uint8Array([1, 2, 3]),
          }),
        }),
      },
    }
  })

  it('throws if not enough balance for amount + fee (specific native amount to transfer)', async () => {
    const api = { ...mockApi, tx: { ...mockApi.tx }, query: { ...mockApi.query } }
    // fee = 10, nativeAmount = 100, transferable = 105
    api.tx.balances.transferKeepAlive.mockReturnValue({
      method: mockMethod,
      toString: () => 'nativeTransfer:100',
      paymentInfo: vi.fn().mockResolvedValue({ partialFee: { toString: () => '10' } }),
    })
    api.tx.utility.batchAll.mockReturnValue({
      method: mockMethod,
      toString: () => 'batch:nftTransfer,uniqueTransfer,nativeTransfer:100',
      paymentInfo: vi.fn().mockResolvedValue({ partialFee: { toString: () => '10' } }),
    })
    api.tx.nfts.transfer.mockReturnValue({ method: mockMethod, toString: () => 'nftTransfer', paymentInfo: vi.fn() })
    api.tx.uniques.transfer.mockReturnValue({ method: mockMethod, toString: () => 'uniqueTransfer', paymentInfo: vi.fn() })
    await expect(
      prepareTransaction(api as unknown as ApiPromise, mockSender, mockReceiver, 105, mockNFTs, mockAppConfig, 100)
    ).rejects.toThrow(errorDetails.insufficient_balance_to_cover_fee.description)
  })

  it('throws if not enough balance for fee (NFTs only)', async () => {
    const api = { ...mockApi, tx: { ...mockApi.tx }, query: { ...mockApi.query } }
    // fee = 10, transferable = 5
    api.tx.nfts.transfer.mockReturnValue({ method: mockMethod, toString: () => 'nftTransfer', paymentInfo: vi.fn() })
    api.tx.uniques.transfer.mockReturnValue({ method: mockMethod, toString: () => 'uniqueTransfer', paymentInfo: vi.fn() })
    api.tx.utility.batchAll.mockReturnValue({
      method: mockMethod,
      toString: () => 'batch:nftTransfer,uniqueTransfer',
      paymentInfo: vi.fn().mockResolvedValue({ partialFee: { toString: () => '10' } }),
    })
    await expect(prepareTransaction(api as unknown as ApiPromise, mockSender, mockReceiver, 5, mockNFTs, mockAppConfig)).rejects.toThrow(
      errorDetails.insufficient_balance.description
    )
  })

  it('throws if not enough balance for fee (max native)', async () => {
    const api = { ...mockApi, tx: { ...mockApi.tx }, query: { ...mockApi.query } }
    // fee = 10, nativeAmount = transferable = 10
    api.tx.balances.transferKeepAlive.mockReturnValue({
      method: mockMethod,
      toString: () => 'nativeTransfer:10',
      paymentInfo: vi.fn().mockResolvedValue({ partialFee: { toString: () => '10' } }),
    })
    api.tx.utility.batchAll.mockReturnValue({
      method: mockMethod,
      toString: () => 'batch:nftTransfer,uniqueTransfer,nativeTransfer:10',
      paymentInfo: vi.fn().mockResolvedValue({ partialFee: { toString: () => '10' } }),
    })
    await expect(
      prepareTransaction(api as unknown as ApiPromise, mockSender, mockReceiver, 10, mockNFTs, mockAppConfig, 10)
    ).rejects.toThrow(errorDetails.insufficient_balance.description)
  })

  it('returns payload if enough balance for amount + fee (specific native amount to transfer)', async () => {
    const api = { ...mockApi, tx: { ...mockApi.tx }, query: { ...mockApi.query } }
    // fee = 10, nativeAmount = 100, transferable = 200
    api.tx.balances.transferKeepAlive.mockReturnValue({
      method: mockMethod,
      toString: () => 'nativeTransfer:100',
      paymentInfo: vi.fn().mockResolvedValue({ partialFee: { toString: () => '10' } }),
    })
    api.tx.utility.batchAll.mockReturnValue({
      method: mockMethod,
      toString: () => 'batch:nftTransfer,uniqueTransfer,nativeTransfer:100',
      paymentInfo: vi.fn().mockResolvedValue({ partialFee: { toString: () => '10' } }),
    })
    const result = await prepareTransaction(api as unknown as ApiPromise, mockSender, mockReceiver, 200, mockNFTs, mockAppConfig, 100)
    expect(result).toBeDefined()
  })

  it('returns payload if enough balance for NFTs only (fee covered)', async () => {
    const api = { ...mockApi, tx: { ...mockApi.tx }, query: { ...mockApi.query } }
    // fee = 10, transferable = 100
    api.tx.nfts.transfer.mockReturnValue({ method: mockMethod, toString: () => 'nftTransfer', paymentInfo: vi.fn() })
    api.tx.uniques.transfer.mockReturnValue({ method: mockMethod, toString: () => 'uniqueTransfer', paymentInfo: vi.fn() })
    api.tx.utility.batchAll.mockReturnValue({
      method: mockMethod,
      toString: () => 'batch:nftTransfer,uniqueTransfer',
      paymentInfo: vi.fn().mockResolvedValue({ partialFee: { toString: () => '10' } }),
    })
    const result = await prepareTransaction(api as unknown as ApiPromise, mockSender, mockReceiver, 100, mockNFTs, mockAppConfig)
    expect(result).toBeDefined()
  })

  it('returns payload if enough balance for max native transfer (fee covered)', async () => {
    const api = { ...mockApi, tx: { ...mockApi.tx }, query: { ...mockApi.query } }
    // fee = 10, nativeAmount = transferable = 110
    api.tx.balances.transferKeepAlive.mockReturnValue({
      method: mockMethod,
      toString: () => 'nativeTransfer:110',
      paymentInfo: vi.fn().mockResolvedValue({ partialFee: { toString: () => '10' } }),
    })
    api.tx.utility.batchAll.mockReturnValue({
      method: mockMethod,
      toString: () => 'batch:nftTransfer,uniqueTransfer,nativeTransfer:110',
      paymentInfo: vi.fn().mockResolvedValue({ partialFee: { toString: () => '10' } }),
    })
    const result = await prepareTransaction(api as unknown as ApiPromise, mockSender, mockReceiver, 110, mockNFTs, mockAppConfig, 110)
    expect(result).toBeDefined()
  })
})
