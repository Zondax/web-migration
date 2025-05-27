import { SubmittableExtrinsic } from '@polkadot/api/types'
import { ISubmittableResult } from '@polkadot/types/types'
import { App, AppStatus } from 'state/ledger'
import { Address, Collection, Nft } from 'state/types/ledger'
import { vi } from 'vitest'

import { AppConfig } from '@/config/apps'

// =========== Common Test Addresses ===========
export const TEST_ADDRESSES = {
  ADDRESS1: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
  ADDRESS2: '5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y',
  ADDRESS3: '5DAAnrj7VHTznn2C221g2pvCnvVy9AHbLP7RP9ueGZFg7AAW',
  ADDRESS4: '5HGjWAeFDfFCWPsjFQdVV2Msvz2XtMktvgocEZcCj68kUMaw',
  ADDRESS5: '5CiPPseXPECbkjWCa6MnjNokrgYjMqmKndv2rSnekmSK2DjL',
  ADDRESS6: '5H4MvAsobfZ6bBCDyj5dsrWYLrA8HrRzaqa9p61UXtxMhSCY',
  ADDRESS7: '5DAUh2JEqgjoq7xKmvUdaNkDRRtwqYGtxKzovLHdkkNcsuFJ',
}

// =========== Mock NFTs ===========
export const mockNft1: Nft = {
  collectionId: '1',
  itemId: '101',
  creator: TEST_ADDRESSES.ADDRESS1,
  owner: TEST_ADDRESSES.ADDRESS1,
}

export const mockNft2: Nft = {
  collectionId: '1',
  itemId: '102',
  creator: TEST_ADDRESSES.ADDRESS1,
  owner: TEST_ADDRESSES.ADDRESS1,
}

export const mockNft3: Nft = {
  collectionId: '2',
  itemId: '201',
  creator: TEST_ADDRESSES.ADDRESS3,
  owner: TEST_ADDRESSES.ADDRESS3,
}

export const mockNft4: Nft = {
  collectionId: '3',
  itemId: '301',
  creator: TEST_ADDRESSES.ADDRESS5,
  owner: TEST_ADDRESSES.ADDRESS5,
}

// NFTs with numeric collection IDs
export const mockNftNumericId1: Nft = {
  collectionId: 4,
  itemId: '401',
  creator: TEST_ADDRESSES.ADDRESS6,
  owner: TEST_ADDRESSES.ADDRESS6,
}

export const mockNftNumericId2: Nft = {
  collectionId: 4,
  itemId: '402',
  creator: TEST_ADDRESSES.ADDRESS6,
  owner: TEST_ADDRESSES.ADDRESS6,
}

export const mockUnique: Nft = {
  collectionId: '2',
  itemId: '1',
  creator: TEST_ADDRESSES.ADDRESS1,
  owner: TEST_ADDRESSES.ADDRESS1,
  isUnique: true,
}

// =========== Mock Collections ===========
export const mockCollection1: Collection = {
  collectionId: 1,
  name: 'Collection One',
  owner: TEST_ADDRESSES.ADDRESS1,
  items: 2,
  image: 'ipfs://collection1.png',
}

export const mockCollection2: Collection = {
  collectionId: 2,
  name: 'Collection Two',
  owner: TEST_ADDRESSES.ADDRESS3,
  items: 1,
  image: 'ipfs://collection2.png',
}

export const mockCollection3: Collection = {
  collectionId: 3,
  name: 'Collection Three',
  owner: TEST_ADDRESSES.ADDRESS5,
  items: 1,
}

export const mockCollection4: Collection = {
  collectionId: 4,
  name: 'Collection Four',
  owner: TEST_ADDRESSES.ADDRESS6,
  items: 2,
}

// =========== Mock Addresses ===========
export const mockAddress1: Address = {
  path: "m/44'/354'/0'/0'",
  pubKey: '0x123',
  address: TEST_ADDRESSES.ADDRESS1,
  balance: {
    native: 1000,
    nfts: [],
    uniques: [],
  },
}

export const mockAddress2: Address = {
  path: "m/44'/354'/0'/1'",
  pubKey: '0x456',
  address: TEST_ADDRESSES.ADDRESS2,
  balance: {
    native: 0,
    nfts: [mockNft1],
    uniques: [],
  },
}

export const mockAddress3: Address = {
  path: "m/44'/354'/0'/2'",
  pubKey: '0x789',
  address: TEST_ADDRESSES.ADDRESS3,
  balance: {
    native: 0,
    nfts: [],
    uniques: [mockUnique],
  },
}

export const mockAddressWithError: Address = {
  path: "m/44'/354'/0'/3'",
  pubKey: '0xabc',
  address: TEST_ADDRESSES.ADDRESS4,
  error: {
    source: 'balance_fetch',
    description: 'Failed to sync',
  },
  balance: undefined,
}

export const mockAddressWithMigrationError: Address = {
  path: "m/44'/354'/0'/4'",
  pubKey: '0xdef',
  address: TEST_ADDRESSES.ADDRESS5,
  error: {
    source: 'migration',
    description: 'Migration failed',
  },
  balance: undefined,
}

export const mockAddressNoBalance: Address = {
  path: "m/44'/354'/0'/5'",
  pubKey: '0xeee',
  address: TEST_ADDRESSES.ADDRESS6,
  balance: {
    native: 0,
    nfts: [],
    uniques: [],
  },
}

export const mockAddressPartialBalance: Address = {
  path: "m/44'/354'/0'/6'",
  pubKey: '0xfff',
  address: TEST_ADDRESSES.ADDRESS7,
  balance: {
    native: 0,
    nfts: [],
  },
}

// =========== Mock Apps ===========
export const mockApp1: App = {
  name: 'App 1',
  id: 'polkadot',
  token: {
    symbol: 'DOT',
    decimals: 10,
    logoId: 'polkadot',
  },
  status: AppStatus.SYNCHRONIZED,
  accounts: [mockAddress1, mockAddress2],
}

export const mockApp2: App = {
  name: 'App 2',
  id: 'kusama',
  token: {
    symbol: 'KSM',
    decimals: 12,
    logoId: 'kusama',
  },
  status: AppStatus.SYNCHRONIZED,
  accounts: [mockAddress3, mockAddressWithError],
}

export const mockAppWithMigrationError: App = {
  name: 'App 3',
  id: 'westend',
  token: {
    symbol: 'WND',
    decimals: 12,
    logoId: 'westend',
  },
  status: AppStatus.SYNCHRONIZED,
  accounts: [mockAddressWithMigrationError],
}

export const mockAppWithAppError: App = {
  name: 'App 4',
  id: 'acala',
  token: {
    symbol: 'ACA',
    decimals: 12,
    logoId: 'acala',
  },
  status: AppStatus.ERROR,
  error: {
    source: 'synchronization',
    description: 'App sync failed',
  },
  accounts: [],
}

export const mockAppMixedErrorTypes: App = {
  name: 'App 5',
  id: 'moonbeam',
  token: {
    symbol: 'GLMR',
    decimals: 18,
    logoId: 'moonbeam',
  },
  status: AppStatus.SYNCHRONIZED,
  accounts: [mockAddress1, mockAddressWithError, mockAddressWithMigrationError],
}

export const mockAppNoAccounts: App = {
  name: 'App 6',
  id: 'astar',
  token: {
    symbol: 'ASTR',
    decimals: 18,
    logoId: 'astar',
  },
  status: AppStatus.SYNCHRONIZED,
  accounts: [],
}

// =========== Grouped Mock Data ===========
export const mockNfts = [mockNft1, mockNft2, mockNft3, mockNft4]
export const mockMixedIdNfts = [mockNft1, mockNftNumericId1, mockNft3]
export const mockCollections = [mockCollection1, mockCollection2, mockCollection3, mockCollection4]
export const mockApps = [mockApp1, mockApp2, mockAppWithMigrationError, mockAppWithAppError]
export const mockAppsExtended = [...mockApps, mockAppMixedErrorTypes, mockAppNoAccounts]

export const mockAppConfig: AppConfig = {
  id: 'test',
  name: 'TestApp',
  cla: 1234,
  bip44Path: "m/44'/354'/0'/0/0",
  ss58Prefix: 42,
  token: { decimals: 12, symbol: 'UNIT' },
}

export const mockMethod = { toHex: () => '0xdeadbeef' }
export const mockApi = {
  tx: {
    nfts: { transfer: vi.fn(() => ({ method: mockMethod, toString: () => 'nftTransfer', paymentInfo: vi.fn() })) },
    uniques: { transfer: vi.fn(() => ({ method: mockMethod, toString: () => 'uniqueTransfer', paymentInfo: vi.fn() })) },
    balances: {
      transferKeepAlive: vi.fn((_: string, amount: number) => ({
        method: mockMethod,
        toString: () => `nativeTransfer:${amount}`,
        paymentInfo: vi.fn().mockResolvedValue({ partialFee: { toString: () => '10' } }),
      })),
    },
    utility: {
      batchAll: vi.fn((calls: SubmittableExtrinsic<'promise', ISubmittableResult>[]) => ({
        method: mockMethod,
        toString: () => `batch:${calls.join(',')}`,
        paymentInfo: vi.fn().mockResolvedValue({ partialFee: { toString: () => '10' } }),
      })),
    },
  },
  query: {
    system: { account: vi.fn() },
  },
  call: {
    metadata: {
      metadataAtVersion: vi.fn().mockResolvedValue({
        isNone: false,
        unwrap: () => ({
          digest: () => 'mockDigest',
          getProofForExtrinsicPayload: () => new Uint8Array([1, 2, 3]),
        }),
      }),
    },
  },
  runtimeVersion: {
    transactionVersion: 1,
    specVersion: 1,
  },
  genesisHash: '0x1234567890abcdef',
  extrinsicVersion: 4,
  createType: vi.fn(() => ({
    toU8a: () => new Uint8Array([1, 2, 3]),
  })),
}
