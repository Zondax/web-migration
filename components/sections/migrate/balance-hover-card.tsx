import { useMemo } from 'react'
import { AddressBalance, Native, Nft } from '@/state/types/ledger'
import { Collections } from 'state/ledger'

import { Token } from '@/config/apps'
import { formatBalance } from '@/lib/utils'
import { hasStakedBalance, isNativeBalance, isNftBalanceType, isUniqueBalanceType } from '@/lib/utils/balance'
import { createNftBalances } from '@/lib/utils/nft'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'

import { BalanceTypeFlag } from './balance-detail-card'
import BalanceGallery from './balance-gallery'
import NftCircles from './nft-circles'

interface BalanceHoverCardProps {
  balances: AddressBalance[]
  collections?: Collections
  token: Token
  isMigration?: boolean // if true, only show transferable amount of native balance
}

/**
 * A component that shows balances with a hover card that displays details
 * Can display multiple types of balances including native tokens, NFTs, and uniques
 * Shows NFT circles for visual representation when NFTs are present
 * Displays a type flag indicator when only one balance type is present
 * Shows a stake flag for native balances that have frozen funds
 */
const BalanceHoverCard = ({ balances, collections, token, isMigration }: BalanceHoverCardProps) => {
  const { nfts, uniques, native } = useMemo(() => {
    // Extract balance based on type
    let nfts: Nft[] | undefined
    let uniques: Nft[] | undefined
    let native: Native | undefined

    // Process each balance in the balances array
    balances.forEach(balance => {
      if (isNftBalanceType(balance)) nfts = balance.balance as Nft[]
      else if (isUniqueBalanceType(balance)) uniques = balance.balance as Nft[]
      else if (isNativeBalance(balance)) native = balance.balance
    })

    // Convert collections map to array for easier lookup
    const uniquesCollectionsArray = Array.from(collections?.uniques.values() || [])
    const nftsCollectionsArray = Array.from(collections?.nfts.values() || [])

    // Create enhanced NFTs with collection data embedded
    const nftBalance = nfts?.length ? createNftBalances(nfts, nftsCollectionsArray) : undefined
    const uniquesBalance = uniques?.length ? createNftBalances(uniques, uniquesCollectionsArray) : undefined

    return { nfts: nftBalance, uniques: uniquesBalance, native }
  }, [balances, collections, token])

  const formattedNativeBalance = useMemo(() => {
    return native ? formatBalance(isMigration ? native.transferable : native.total, token) : null
  }, [native, token, isMigration])

  const isSingleBalanceType = balances.length === 1
  const isStaked = isSingleBalanceType && isNativeBalance(balances[0]) && hasStakedBalance(balances[0])

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <div className="flex items-center gap-2 cursor-pointer">
          {/* Show formatted native balance */}
          {formattedNativeBalance && <span className="font-mono">{formattedNativeBalance}</span>}
          {/* Show NFT circles for visual representation when NFTs are present */}
          {(nfts || uniques) && (
            <NftCircles collections={[...(nfts?.map(nft => nft.collection) || []), ...(uniques?.map(unique => unique.collection) || [])]} />
          )}
          {/* display balance type flag only if there is only one balance type */}
          {isSingleBalanceType && <BalanceTypeFlag type={balances[0].type} />}
          {/* Show stake flag for native balances that have frozen funds */}
          {isSingleBalanceType && isStaked && !isMigration && <BalanceTypeFlag type="Staked" variant="outline" />}
        </div>
      </HoverCardTrigger>
      <HoverCardContent className="w-[calc(100vw-32px)] sm:w-auto max-w-full p-0 ml-4 mr-0 sm:mx-0" align="end">
        <BalanceGallery nfts={nfts} uniques={uniques} native={native} token={token} isMigration={isMigration} />
      </HoverCardContent>
    </HoverCard>
  )
}

export default BalanceHoverCard
