import { ChevronDown } from 'lucide-react'
import type { Transaction } from 'state/types/ledger'

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { AddressLink } from '@/components/AddressLink'

interface TransactionDropdownProps {
  transaction: Transaction | undefined
}

function TransactionDropdown({ transaction }: TransactionDropdownProps) {
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
            <AddressLink value={transaction.hash ?? ''} tooltipText={transaction.hash} className="break-all" />
          </DropdownMenuItem>
        )}
        {transaction.blockHash && (
          <DropdownMenuItem className="gap-2">
            Block Hash:
            <AddressLink value={transaction.blockHash ?? ''} tooltipText={transaction.blockHash} className="break-all" />
          </DropdownMenuItem>
        )}
        {transaction.blockNumber && (
          <DropdownMenuItem className="gap-2">
            Block Number:
            <AddressLink value={transaction.blockNumber ?? ''} tooltipText={transaction.blockNumber} className="break-all" />
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default TransactionDropdown
