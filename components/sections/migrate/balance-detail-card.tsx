import { BalanceType, Collection } from 'state/types/ledger'
import { uiState$ } from 'state/ui'

import { Token } from '@/config/apps'
import { formatBalance } from '@/lib/utils/format'
import { muifyHtml } from '@/lib/utils/html'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface NftDetailCardProps {
  balance: number
  collection: Collection
  isUnique?: boolean
}

const NftDetailCard = ({ balance, collection, isUnique }: NftDetailCardProps) => {
  const imageUrl = collection?.image || collection?.mediaUri

  return (
    <Card className="flex flex-row items-center p-3">
      <div className="h-12 w-12 rounded-full overflow-hidden mr-3 flex-shrink-0">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={`${collection?.name || collection.collectionId}`}
            className="h-full w-full object-cover"
            loading="lazy"
            style={{ imageRendering: 'pixelated' }}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-muted">
            <span className="text-xs text-muted-foreground">NFT</span>
          </div>
        )}
      </div>
      <div className="flex-1">
        <CardHeader className="p-0 pb-2">
          <CardTitle className="text-base flex items-center gap-2 w-full">
            <div className="flex-grow min-w-0 flex items-center">
              <span className="truncate block max-w-[250px]">{collection?.name || `Collection #${collection.collectionId}`}</span>
              <span className="bg-gray-500 text-white text-[10px] px-2 py-0.5 rounded-full ml-2 flex-shrink-0">
                {isUnique ? 'UNIQUE' : 'NFT'}
              </span>
            </div>
            <span className="flex-shrink-0 font-medium font-mono ml-auto">{balance}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex gap-1 p-0 text-sm text-left">
          <div>
            <span>Collection:</span> #{collection.collectionId}
          </div>
        </CardContent>
      </div>
    </Card>
  )
}

interface NativeTokensDetailCardProps {
  balance: number
  token: Token
}

const NativeTokensDetailCard = ({ balance, token }: NativeTokensDetailCardProps) => {
  const icon = uiState$.icons.get()[token.logoId || '']
  const formattedBalance = formatBalance(balance, token, undefined, true)

  return (
    <Card className="flex flex-row items-center p-3">
      <div className="h-12 w-12 rounded-full overflow-hidden mr-3 flex-shrink-0">
        {icon ? (
          <div className="flex h-full w-full items-center justify-center [&_svg]:h-12 [&_svg]:w-12">{muifyHtml(icon)}</div>
        ) : (
          <div className="flex h-full items-center justify-center bg-muted">
            <span className="text-xs text-muted-foreground">{token.symbol}</span>
          </div>
        )}
      </div>
      <div className="flex-1">
        <CardHeader className="p-0 pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            {token.symbol}
            <span className="bg-font-semibold text-white text-[10px] px-2 py-0 rounded-full">NATIVE</span>
            <span className="ml-auto font-medium font-mono">{formattedBalance}</span>
          </CardTitle>
        </CardHeader>
      </div>
    </Card>
  )
}

interface BalanceTypeFlagProps {
  type: BalanceType
}

const BalanceTypeFlag = ({ type }: BalanceTypeFlagProps) => {
  return <span className="bg-gray-500 text-white text-[10px] uppercase px-2 py-0.5 rounded-full ml-2 flex-shrink-0">{type}</span>
}

export { BalanceTypeFlag, NativeTokensDetailCard, NftDetailCard }
