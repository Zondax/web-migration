import { TransactionStatus } from '@/state/types/ledger'
import { AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react'

import { Spinner } from '@/components/icons'

/**
 * Returns a status icon and message corresponding to the given transaction status.
 *
 * @param status - The current transaction status (optional).
 * @param txStatusMessage - An optional custom status message to display.
 * @param size - The size of the status icon ('sm', 'md', or 'lg'). Defaults to 'sm'.
 * @returns An object containing the statusIcon (ReactNode) and an optional statusMessage (string).
 */
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

/**
 * Validates a numeric input value against required, numeric, positive, and maximum constraints.
 *
 * @param value - The input value as a string to validate.
 * @param max - The maximum allowed value (inclusive).
 * @returns An object with a boolean `valid` flag and a `helperText` message for user feedback.
 */
export const validateNumberInput = (value: string, max: number): { valid: boolean; helperText: string } => {
  if (value === '') {
    return { valid: false, helperText: 'Amount is required.' }
  }
  const numValue = Number(value)
  if (Number.isNaN(numValue)) {
    return { valid: false, helperText: 'Amount must be a number.' }
  }
  if (numValue <= 0) {
    return { valid: false, helperText: 'Amount must be greater than zero.' }
  }
  if (numValue > max) {
    return { valid: false, helperText: `Amount cannot exceed your staked balance (${max}).` }
  }
  return { valid: true, helperText: '' }
}
