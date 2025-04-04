import { Collection, Nft } from 'state/types/ledger'

import { NativeTokensDetailCard, NftDetailCard } from './balance-detail-card'

export interface NftBalance {
  items: Nft[]
  collection: Collection
}

export interface NativeBalance {
  balance: number
  ticker: string
  decimals: number
  appId: string
}

interface BalanceGalleryProps {
  nfts?: NftBalance[]
  uniques?: NftBalance[]
  nativeBalance?: NativeBalance
}

const BalanceGallery = ({ nfts, uniques, nativeBalance }: BalanceGalleryProps) => {
  return (
    <div className="flex flex-col gap-3 p-2 max-h-[400px] overflow-y-auto w-full sm:w-auto sm:min-w-[300px]">
      {nativeBalance && (
        <div>
          <NativeTokensDetailCard
            balance={nativeBalance.balance}
            ticker={nativeBalance.ticker}
            decimals={nativeBalance.decimals}
            appId={nativeBalance.appId}
          />
        </div>
      )}
      {uniques?.map(unique => (
        <div key={`${unique.collection.collectionId}-${unique.items[0].itemId}`}>
          <NftDetailCard balance={unique.items.length} collection={unique.collection} isUnique />
        </div>
      ))}
      {nfts?.map(nft => (
        <div key={`${nft.collection.collectionId}-${nft.items[0].itemId}`}>
          <NftDetailCard balance={nft.items.length} collection={nft.collection} />
        </div>
      ))}
    </div>
  )
}

export default BalanceGallery
