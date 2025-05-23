// @vitest-environment node

import type { AccountInfo } from '@polkadot/types/interfaces'
import { describe, expect, it } from 'vitest'

import { disconnectSafely, getApiAndProvider } from '../account'
import { TEST_ADDRESSES } from './utils/__mocks__/mockData'

describe('Account Integration', () => {
  // Used in: getNativeBalance, getBalance, prepareTransactionPayload
  describe('api.query.system.account', () => {
    it('Polkadot API response for api.query.system.account has expected structure', async () => {
      let api, provider, error
      try {
        // Get the API and provider
        const result = await getApiAndProvider('wss://kusama-rpc.polkadot.io')
        api = result.api
        provider = result.provider
        error = result.error

        if (!api || !provider || error) {
          // If the response is undefined or missing api/provider, throw to fail the setup
          throw new Error('Failed to initialize API', { cause: error })
        }
        const raw = await api.query.system.account(TEST_ADDRESSES.ADDRESS2)
        // The response from api.query.system.account should be a Codec with a toHuman() method,
        // but to access the actual data, we need to cast it to the expected type.
        // We'll use AccountInfo from @polkadot/types/interfaces for type safety.

        // Check that the returned object has a toHuman method (Codec interface)
        expect(typeof raw.toHuman).toBe('function')

        // Cast to AccountInfo for type-safe access
        const accountInfo = raw as AccountInfo

        // Check that data has a 'free' property and it's a BN-like object
        expect(accountInfo).toHaveProperty('data')
        expect(accountInfo.data).toHaveProperty('free')
        expect(typeof accountInfo.data.free.toString()).toBe('string')
      } finally {
        // Disconnect from the API
        if (api && provider) {
          await disconnectSafely(api, provider)
        }
      }
    })
  })

  // Used in: getUniquesOwnedByAccount, getBalance
  describe('api.query.uniques.account.entries', () => {
    it('Polkadot API api.query.uniques.account.entries returns an array of entries', async () => {
      let api, provider, error
      try {
        // This test ensures the API call returns an array of [StorageKey, value] tuples as expected by our code.
        const result = await getApiAndProvider('wss://asset-hub-kusama-rpc.dwellir.com')
        api = result.api
        provider = result.provider
        error = result.error

        if (!api || !provider || error) {
          throw new Error('Failed to initialize API', { cause: error })
        }
        const address = TEST_ADDRESSES.ADDRESS2
        const entries = await api.query.uniques.account.entries(address)
        expect(Array.isArray(entries)).toBe(true)
        if (entries.length > 0) {
          // Log for review/debugging
          console.info(`Found ${entries.length} uniques entries for address.`)
          // Check that the first entry is a tuple [StorageKey, value]
          expect(Array.isArray(entries[0])).toBe(true)
          expect(entries[0].length).toBe(2)
        }
      } finally {
        if (api && provider) {
          await disconnectSafely(api, provider)
        }
      }
    })
  })

  // Used in: getNFTsOwnedByAccount, getBalance
  describe('api.query.nfts.account.entries', () => {
    it('Polkadot API api.query.nfts.account.entries returns an array of [StorageKey, value] tuples and keys are extractable', async () => {
      let api, provider, error
      try {
        const result = await getApiAndProvider('wss://asset-hub-kusama-rpc.dwellir.com')
        api = result.api
        provider = result.provider
        error = result.error

        if (!api || !provider || error) throw new Error('Failed to initialize API', { cause: error })

        const address = TEST_ADDRESSES.ADDRESS2
        const entries = await api.query.nfts.account.entries(address)
        expect(Array.isArray(entries)).toBe(true)

        if (entries.length > 0) {
          // Log for review/debugging
          console.info(`Found ${entries.length} NFT entries for address.`)
          // Check that the first entry is a tuple [StorageKey, value]
          expect(Array.isArray(entries[0])).toBe(true)
          expect(entries[0].length).toBe(2)
          // Check that key.args is an array and has at least 3 elements (address, collectionId, itemId)
          const [key] = entries[0]
          expect(Array.isArray(key.args)).toBe(true)
          expect(key.args.length).toBeGreaterThanOrEqual(3)
          // Optionally, check that collectionId and itemId are present and can be stringified
          const collectionId = key.args[1]
          const itemId = key.args[2]
          expect(typeof collectionId.toString()).toBe('string')
          expect(typeof itemId.toString()).toBe('string')
        }
      } finally {
        if (api && provider) {
          await disconnectSafely(api, provider)
        }
      }
    })
  })
})
