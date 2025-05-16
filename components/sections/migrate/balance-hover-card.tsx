import { useMemo } from 'react'
import { AddressBalance, BalanceType, Nft } from '@/state/types/ledger'
import { Collections } from 'state/ledger'

import { Token } from '@/config/apps'
import { formatBalance } from '@/lib/utils'
import { createNftBalances } from '@/lib/utils/nft'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'

import { BalanceTypeFlag } from './balance-detail-card'
import BalanceGallery from './balance-gallery'
import NftCircles from './nft-circles'

interface BalanceHoverCardProps {
  balance: AddressBalance
  collections?: Collections
  token: Token
}

/**
 * A component that shows NFT circles with a hover card that displays the NFT gallery
 */
const BalanceHoverCard = ({ balance, collections, token }: BalanceHoverCardProps) => {
  const { nfts, uniques, nativeTokens } = useMemo(() => {
    // Extract balance based on type
    let nfts: Nft[] | undefined
    let uniques: Nft[] | undefined
    let native: number | undefined

    if (balance.type === BalanceType.NFT) nfts = balance.balance as Nft[]
    else if (balance.type === BalanceType.UNIQUE) uniques = balance.balance as Nft[]
    else if (balance.type === BalanceType.NATIVE) native = balance.balance as number

    // Convert collections map to array for easier lookup
    const uniquesCollectionsArray = Array.from(collections?.uniques.values() || [])
    const nftsCollectionsArray = Array.from(collections?.nfts.values() || [])

    // Create enhanced NFTs with collection data embedded
    const nftBalance = createNftBalances(nfts || [], nftsCollectionsArray)
    const uniquesBalance = createNftBalances(uniques || [], uniquesCollectionsArray)
    const nativeTokens = native
      ? {
          balance: native,
          token,
        }
      : undefined

    return { nfts: nftBalance, uniques: uniquesBalance, nativeTokens }
  }, [balance, collections, token])

  const formattedNativeBalance = useMemo(() => {
    return nativeTokens?.balance ? formatBalance(nativeTokens.balance, token) : null
  }, [nativeTokens, token])

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <div className="flex items-center gap-2 cursor-pointer">
          {formattedNativeBalance && <span className="font-mono">{formattedNativeBalance}</span>}
          {(nfts || uniques) && (
            <NftCircles collections={[...(nfts?.map(nft => nft.collection) || []), ...(uniques?.map(unique => unique.collection) || [])]} />
          )}
          <BalanceTypeFlag type={balance.type} />
        </div>
      </HoverCardTrigger>
      <HoverCardContent className="w-[calc(100vw-32px)] sm:w-auto p-0 max-w-full sm:max-w-md ml-4 mr-0 sm:mx-0" align="end">
        <BalanceGallery nfts={nfts} uniques={uniques} nativeBalance={nativeTokens} />
      </HoverCardContent>
    </HoverCard>
  )
}

export default BalanceHoverCard
