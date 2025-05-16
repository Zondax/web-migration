import { ApiPromise, WsProvider } from '@polkadot/api'
import { Option } from '@polkadot/types-codec'
import type { StakingLedger } from '@polkadot/types/interfaces'
import { Codec } from '@polkadot/types/types'
import { formatBalance } from '@polkadot/util'

function formatKSM(amount: string): string {
  const value = BigInt(amount)
  const ksm = Number(value) / 1e12
  return `${ksm.toFixed(4)} KSM`
}

async function getApiAndProvider(rpcEndpoint: string): Promise<{ api?: ApiPromise; provider?: WsProvider; error?: string }> {
  try {
    const provider = new WsProvider(rpcEndpoint)
    const api = await ApiPromise.create({ provider })
    return { api, provider }
  } catch (e) {
    console.error('Error creating API:', e)
    return { error: 'Failed to connect to the blockchain.' }
  }
}

// Export the main function if you want to import it elsewhere
export async function main() {
  const rpcEndpoint = 'wss://kusama-rpc.polkadot.io'
  const { api, error } = await getApiAndProvider(rpcEndpoint)
  if (error || !api) {
    throw new Error(error ?? 'Failed to connect to the blockchain.')
  }

  // My wallet
  const address = 'F4aqRHwLaCk2EoEewPWKpJBGdrvkssQAtrBmQ5LdNSweUfV'

  // Get controller list, if not null we have staked amount. If controlled not the address we cant unstake with this account
  let controller = (await api.query.staking.bonded(address)) as Option<Codec>
  if (controller.isSome) {
    if (controller.toHuman() == address) {
      console.log('Controller is the stash address')
    } else {
      console.log('Controller is not the stash address. Cant unstake with this account')
    }
  } else {
    console.log('Account has no active staking')
  }

  const stakingLedgerRaw = (await api.query.staking.ledger(address)) as Option<StakingLedger>
  if (stakingLedgerRaw && !stakingLedgerRaw.isEmpty) {
    const stakingLedger = stakingLedgerRaw.unwrap()
    console.log('Staking Ledger Details:')
    console.log('Stash Account:', stakingLedger.stash.toString())
    console.log('Total Balance:', formatKSM(stakingLedger.total.toString()))
    console.log('Active Balance:', formatKSM(stakingLedger.active.toString()))
    console.log(
      'Unlocking:',
      stakingLedger.unlocking.map(chunk => ({
        value: formatKSM(chunk.value.toString()),
        era: chunk.era.toString(),
      }))
    )
    console.log('Claimed Rewards Eras:', stakingLedger.claimedRewards?.map(era => era.toString()) || [])
  } else {
    console.log('Account has no active staking ledger')
  }

  return 0
}

main()
