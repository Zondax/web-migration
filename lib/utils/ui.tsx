import { TransactionStatus } from '@/state/types/ledger'
import { AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react'

import { Spinner } from '@/components/icons'

export const getTransactionStatus = (
  status?: TransactionStatus,
  txStatusMessage?: string,
  size: 'sm' | 'md' | 'lg' = 'sm'
): { statusIcon: React.ReactNode; statusMessage?: string } => {
  let statusIcon: React.ReactNode | null = null
  let statusMessage = txStatusMessage

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  }

  const iconSize = sizeClasses[size]

  switch (status) {
    case TransactionStatus.IS_LOADING:
      statusIcon = <Spinner />
      statusMessage = 'Loading...'
      break
    case TransactionStatus.PENDING:
      statusIcon = <Clock className={`${iconSize} text-muted-foreground`} />
      statusMessage = 'Transaction pending...'
      break
    case TransactionStatus.IN_BLOCK:
      statusIcon = <Clock className={`${iconSize} text-muted-foreground`} />
      break
    case TransactionStatus.FINALIZED:
      statusIcon = <Clock className={`${iconSize} text-muted-foreground`} />
      break
    case TransactionStatus.SUCCESS:
      statusIcon = <CheckCircle className={`${iconSize} text-green-500`} />
      break
    case TransactionStatus.FAILED:
      statusIcon = <XCircle className={`${iconSize} text-red-500`} />
      break
    case TransactionStatus.ERROR:
      statusIcon = <AlertCircle className={`${iconSize} text-red-500`} />
      break
    case TransactionStatus.WARNING:
      statusIcon = <AlertCircle className={`${iconSize} text-yellow-500`} />
      break
    case TransactionStatus.COMPLETED:
      statusIcon = <Clock className={`${iconSize} text-muted-foreground`} />
      break
    default:
      statusIcon = (
        <span className="px-2 py-1 text-xs rounded-full bg-polkadot-lime text-black border border-storm-200">Ready to migrate</span>
      )
  }
  return { statusIcon, statusMessage }
}

export const isValidNumberInput = (value: string): boolean => {
  return /^\d*\.?\d*$/.test(value)
}
