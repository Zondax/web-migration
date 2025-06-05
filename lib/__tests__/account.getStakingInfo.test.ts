import type { ApiPromise } from '@polkadot/api'
import type { u32 } from '@polkadot/types'
import type { Option, Vec } from '@polkadot/types-codec'
import type { AccountId32, Balance, StakingLedger } from '@polkadot/types/interfaces'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getStakingInfo } from '../account'

const mockAddress = '5FakeStashAddress1234567890'
const mockController = '5FakeControllerAddress0987654321'

function createApiMock({
  bonded,
  ledger,
  currentEra,
}: {
  bonded?: Option<AccountId32>
  ledger?: Option<StakingLedger>
  currentEra?: Option<u32>
}) {
  return {
    query: {
      staking: {
        bonded: vi.fn().mockResolvedValue(bonded),
        ledger: vi.fn().mockResolvedValue(ledger),
        currentEra: vi.fn().mockResolvedValue(currentEra),
      },
    },
  } as unknown as ApiPromise
}

describe('getStakingInfo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns undefined when account is not staking (no controller)', async () => {
    const bonded = { isSome: false } as Option<AccountId32>
    const api = createApiMock({ bonded })
    const result = await getStakingInfo(mockAddress, api)
    expect(result).toBeUndefined()
  })

  it('returns staking info with no unlocking chunks', async () => {
    const bonded = { isSome: true, toHuman: () => mockController } as unknown as Option<AccountId32>
    const stakingLedger = {
      isEmpty: false,
      unwrap: () => ({
        active: { toNumber: () => 1000 },
        total: { toNumber: () => 1200 },
        unlocking: [],
      }),
    } as unknown as Option<StakingLedger>
    const currentEra = { isSome: true, unwrap: () => ({ toString: () => '100' }) } as unknown as Option<u32>
    const api = createApiMock({ bonded, ledger: stakingLedger, currentEra })
    const result = await getStakingInfo(mockAddress, api)
    expect(result).toEqual({
      controller: mockController,
      canUnstake: false,
      active: 1000,
      total: 1200,
      unlocking: [],
    })
  })

  it('returns staking info with unlocking chunks', async () => {
    const bonded = { isSome: true, toHuman: () => mockController } as unknown as Option<AccountId32>
    const unlockingChunk = {
      value: { toNumber: () => 500 },
      era: { toString: () => '105' },
    }
    const stakingLedger = {
      isEmpty: false,
      unwrap: () => ({
        active: { toNumber: () => 1000 },
        total: { toNumber: () => 1200 },
        unlocking: [unlockingChunk],
      }),
    } as unknown as Option<StakingLedger>
    const currentEra = { isSome: true, unwrap: () => ({ toString: () => '100' }) } as unknown as Option<u32>
    const api = createApiMock({ bonded, ledger: stakingLedger, currentEra })
    const result = await getStakingInfo(mockAddress, api)
    expect(result).toEqual({
      controller: mockController,
      canUnstake: false,
      active: 1000,
      total: 1200,
      unlocking: [
        {
          value: 500,
          era: 105,
          timeRemaining: '1 days and 6 hours',
          canWithdraw: false,
        },
      ],
    })
  })

  it('returns undefined when staking ledger is empty', async () => {
    const bonded = { isSome: true, toHuman: () => mockController } as unknown as Option<AccountId32>
    const stakingLedger = { isEmpty: true } as unknown as Option<StakingLedger>
    const api = createApiMock({ bonded, ledger: stakingLedger })
    const result = await getStakingInfo(mockAddress, api)
    expect(result).toBeUndefined()
  })
})
