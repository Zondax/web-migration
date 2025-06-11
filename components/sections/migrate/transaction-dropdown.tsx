import { ChevronDown } from 'lucide-react'
import type { Transaction } from 'state/types/ledger'

import { ExplorerLink } from '@/components/ExplorerLink'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import type { AppId } from '@/config/apps'
import { ExplorerItemType } from '@/config/explorers'

interface TransactionDropdownProps {
  transaction: Transaction | undefined
  appId: AppId
}

function TransactionDropdown({ transaction, appId }: TransactionDropdownProps) {
  if (!transaction?.hash) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <ChevronDown className="h-4 w-4 text-muted-foreground cursor-pointer" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-[300px]">
        {/* Transaction Details */}
        {transaction.hash && (
          <DropdownMenuItem className="gap-2">
            Transaction Hash:
            <ExplorerLink
              value={transaction.hash}
              appId={appId}
              explorerLinkType={ExplorerItemType.Transaction}
              tooltipBody={`View transaction ${transaction.hash} on explorer`}
              className="break-all"
            />
          </DropdownMenuItem>
        )}
        {transaction.blockHash && (
          <DropdownMenuItem className="gap-2">
            Block Hash:
            <ExplorerLink
              value={transaction.blockHash}
              appId={appId}
              explorerLinkType={ExplorerItemType.BlockHash}
              tooltipBody={`View block ${transaction.blockHash} on explorer`}
              className="break-all"
            />
          </DropdownMenuItem>
        )}
        {transaction.blockNumber && (
          <DropdownMenuItem className="gap-2">
            Block Number:
            <ExplorerLink
              value={transaction.blockNumber ?? ''}
              appId={appId}
              explorerLinkType={ExplorerItemType.BlockNumber}
              tooltipBody={transaction.blockNumber}
              className="break-all"
            />
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default TransactionDropdown
