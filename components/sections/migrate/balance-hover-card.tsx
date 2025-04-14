import { useMemo } from 'react'
import { Balance } from '@/state/types/ledger'
import { Collections } from 'state/ledger'

import { formatBalance } from '@/lib/utils'
import { createNftBalances } from '@/lib/utils/nft'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'

import BalanceGallery from './balance-gallery'
import NftCircles from './nft-circles'

interface BalanceHoverCardProps {
  balance: Balance
  collections?: Collections
  ticker: string
  decimals: number
  tokenIconId: string
}

/**
 * A component that shows NFT circles with a hover card that displays the NFT gallery
 */
const BalanceHoverCard = ({ balance, collections, ticker, decimals, tokenIconId }: BalanceHoverCardProps) => {
  const { nfts, uniques, nativeTokens } = useMemo(() => {
    const nfts = balance.nfts
    const uniques = balance.uniques
    const native = balance.native

    // Convert collections map to array for easier lookup
    const uniquesCollectionsArray = Array.from(collections?.uniques.values() || [])
    const nftsCollectionsArray = Array.from(collections?.nfts.values() || [])

    // Create enhanced NFTs with collection data embedded
    const nftBalance = createNftBalances(nfts || [], nftsCollectionsArray)
    const uniquesBalance = createNftBalances(uniques || [], uniquesCollectionsArray)
    const nativeTokens = native
      ? {
          balance: native,
          ticker,
          decimals,
          tokenIconId,
        }
      : undefined

    return { nfts: nftBalance, uniques: uniquesBalance, nativeTokens }
  }, [balance, collections, tokenIconId, decimals, ticker])

  const formattedNativeBalance = balance.native ? formatBalance(balance.native, ticker, decimals) : null

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <div className="flex items-center gap-2 cursor-pointer">
          {formattedNativeBalance && <span className="font-mono">{formattedNativeBalance}</span>}
          {(nfts || uniques) && (
            <NftCircles collections={[...(nfts?.map(nft => nft.collection) || []), ...(uniques?.map(unique => unique.collection) || [])]} />
          )}
        </div>
      </HoverCardTrigger>
      <HoverCardContent className="w-[calc(100vw-32px)] sm:w-auto p-0 max-w-full sm:max-w-md ml-4 mr-0 sm:mx-0" align="end">
        <BalanceGallery nfts={nfts} uniques={uniques} nativeBalance={nativeTokens} />
      </HoverCardContent>
    </HoverCard>
  )
}

export default BalanceHoverCard
