// @vitest-environment node

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { ApiPromise, WsProvider } from '@polkadot/api'
import type { Option, u32 } from '@polkadot/types-codec'
import type { AccountId32, StakingLedger } from '@polkadot/types/interfaces'
import { disconnectSafely, getApiAndProvider } from '../account'
import { KUSAMA_ASSET_HUB_RPC, KUSAMA_RPC, TEST_ADDRESSES } from './utils/__mocks__/mockData'

describe('Account Integration', () => {
  // Shared connections for each endpoint
  let api: ApiPromise | undefined
  let provider: WsProvider | undefined
  let error: string | undefined

  let assetHubApi: ApiPromise | undefined
  let assetHubProvider: WsProvider | undefined
  let assetHubError: string | undefined

  beforeAll(async () => {
    // Connect to KUSAMA_RPC
    const result = await getApiAndProvider(KUSAMA_RPC)
    api = result.api
    provider = result.provider
    error = result.error
    // Connect to KUSAMA_ASSET_HUB_RPC
    const assetHubResult = await getApiAndProvider(KUSAMA_ASSET_HUB_RPC)
    assetHubApi = assetHubResult.api
    assetHubProvider = assetHubResult.provider
    assetHubError = assetHubResult.error
  })

  afterAll(async () => {
    if (api && provider) {
      await disconnectSafely(api, provider)
    }
    if (assetHubApi && assetHubProvider) {
      await disconnectSafely(assetHubApi, assetHubProvider)
    }
  })

  // Used in: getNativeBalance, getBalance, prepareTransactionPayload
  describe('api.query.system.account', () => {
    it('Polkadot API response for api.query.system.account has expected structure', async () => {
      if (!api || !provider || error) {
        throw new Error('Failed to initialize API', { cause: error })
      }
      const raw = await api.query.system.account(TEST_ADDRESSES.ADDRESS2)

      // The response from api.query.system.account should be a Codec with a toHuman() method,
      // but to access the actual data, we need to cast it to the expected type.
      // We'll use AccountInfo from @polkadot/types/interfaces for type safety.

      expect(typeof raw.toHuman).toBe('function')
      const accountInfo = raw as any // AccountData is not updated in @polkadot/types

      // Check that the response has the expected properties
      expect(accountInfo).toHaveProperty('data')
      expect(accountInfo.data).toHaveProperty('free')
      expect(accountInfo.data).toHaveProperty('frozen')
      expect(accountInfo.data).toHaveProperty('reserved')
      expect(typeof accountInfo.data.free.toString()).toBe('string')
      expect(typeof accountInfo.data.frozen.toString()).toBe('string')
      expect(typeof accountInfo.data.reserved.toString()).toBe('string')
    })
  })

  // Used in: getStakingInfo
  describe('api.query.staking.bonded', () => {
    it('Polkadot API api.query.staking.bonded returns Option<AccountId32>', async () => {
      if (!api || !provider || error) {
        throw new Error('Failed to initialize API', { cause: error })
      }

      const address = TEST_ADDRESSES.ADDRESS9

      // The response from api.query.staking.bonded should be an Option<AccountId32>
      const bonded = (await api.query.staking.bonded(address)) as Option<AccountId32>

      // Check that the response has the expected properties
      expect(bonded).toHaveProperty('isSome')
      expect(bonded).toHaveProperty('isNone')
      expect(typeof bonded.isSome).toBe('boolean')
      expect(typeof bonded.isNone).toBe('boolean')

      if (bonded.isSome) {
        const controller = bonded.unwrap()
        expect(typeof controller.toHuman()).toBe('string')
      }
    })
  })

  // Used in: getUniquesOwnedByAccount, getBalance
  describe('api.query.uniques.account.entries', () => {
    it('Polkadot API api.query.uniques.account.entries returns an array of entries', async () => {
      if (!assetHubApi || !assetHubProvider || assetHubError) {
        throw new Error('Failed to initialize API', { cause: assetHubError })
      }

      const address = TEST_ADDRESSES.ADDRESS8

      // The response from api.query.uniques.account.entries should be an array of [StorageKey, value] tuples
      const entries = await assetHubApi.query.uniques.account.entries(address)

      // Check that the response has the expected properties
      expect(Array.isArray(entries)).toBe(true)
      if (entries.length > 0) {
        expect(Array.isArray(entries[0])).toBe(true)
        expect(entries[0].length).toBe(2)
      }
    })
  })

  // Used in: getNFTsOwnedByAccount, getBalance
  describe('api.query.nfts.account.entries', () => {
    it('Polkadot API api.query.nfts.account.entries returns an array of [StorageKey, value] tuples and keys are extractable', async () => {
      if (!assetHubApi || !assetHubProvider || assetHubError) throw new Error('Failed to initialize API', { cause: assetHubError })

      const address = TEST_ADDRESSES.ADDRESS2

      // The response from api.query.nfts.account.entries should be an array of [StorageKey, value] tuples
      const entries = await assetHubApi.query.nfts.account.entries(address)

      // Check that the response has the expected properties
      expect(Array.isArray(entries)).toBe(true)
      if (entries.length > 0) {
        // Check that the first entry is a tuple [StorageKey, value]
        expect(Array.isArray(entries[0])).toBe(true)
        expect(entries[0].length).toBe(2)
        // Check that key.args is an array and has at least 3
        const [key] = entries[0]
        expect(Array.isArray(key.args)).toBe(true)
        expect(key.args.length).toBeGreaterThanOrEqual(3)
        // Optionally, check that collectionId and itemId are present and can be stringified
        const collectionId = key.args[1]
        const itemId = key.args[2]
        expect(typeof collectionId.toString()).toBe('string')
        expect(typeof itemId.toString()).toBe('string')
      }
    })
  })

  // Used in: getStakingInfo
  describe('api.query.staking.ledger', () => {
    it('Polkadot API api.query.staking.ledger returns Option<StakingLedger>', async () => {
      if (!api || !provider || error) {
        throw new Error('Failed to initialize API', { cause: error })
      }

      const address = TEST_ADDRESSES.ADDRESS9
      // First, get the controller address from bonded
      const bonded = (await api.query.staking.bonded(address)) as Option<AccountId32>
      if (!bonded.isSome) {
        // If not bonded, skip this test
        console.log(
          'Polkadot API api.query.staking.ledger returns Option<StakingLedger>: the test is not valid because the address is not bonded'
        )
        return
      }
      const controller = bonded.unwrap().toHuman() as string

      // The response from api.query.staking.ledger should be an Option<StakingLedger>
      const ledger = (await api.query.staking.ledger(controller)) as Option<StakingLedger>

      // Check that the response has the expected properties
      expect(ledger).toHaveProperty('isSome')
      expect(ledger).toHaveProperty('isEmpty')
      expect(typeof ledger.isSome).toBe('boolean')
      expect(typeof ledger.isEmpty).toBe('boolean')

      if (ledger.isSome) {
        const stakingLedger = ledger.unwrap()
        expect(stakingLedger).toHaveProperty('active')
        expect(stakingLedger).toHaveProperty('total')
        expect(stakingLedger).toHaveProperty('unlocking')
        expect(typeof stakingLedger.active.toNumber()).toBe('number')
        expect(typeof stakingLedger.total.toNumber()).toBe('number')
        expect(Array.isArray(stakingLedger.unlocking)).toBe(true)
      }
    })
  })

  // Used in: getStakingInfo
  describe('api.query.staking.currentEra', () => {
    it('Polkadot API api.query.staking.currentEra returns Option<u32>', async () => {
      if (!api || !provider || error) {
        throw new Error('Failed to initialize API', { cause: error })
      }

      // The response from api.query.staking.currentEra should be an Option<u32>
      const currentEra = (await api.query.staking.currentEra()) as Option<u32>

      // Check that the response has the expected properties
      expect(currentEra).toHaveProperty('isSome')
      expect(currentEra).toHaveProperty('isNone')
      expect(typeof currentEra.isSome).toBe('boolean')
      expect(typeof currentEra.isNone).toBe('boolean')
      if (currentEra.isSome) {
        const eraValue = currentEra.unwrap()
        // Should be a number or string convertible to number
        expect(typeof eraValue.toString()).toBe('string')
        expect(!Number.isNaN(Number(eraValue.toString()))).toBe(true)
      }
    })
  })
})
