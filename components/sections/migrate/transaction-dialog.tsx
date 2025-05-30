import { AddressLink } from '@/components/AddressLink'
import { Button } from '@/components/ui/button'
import { getTransactionStatus } from '@/lib/utils/ui'
import { type Transaction, TransactionStatus } from '@/state/types/ledger'

/**
 * TransactionStatusBody
 *
 * Displays the status of a blockchain transaction, including a status icon, a message,
 * and optional transaction details such as transaction hash, block hash, and block number.
 */
function TransactionStatusBody({ status, statusMessage: txStatusMessage, hash, blockHash, blockNumber }: Transaction) {
  if (!status) return null

  // Collect transaction details only if they exist, and filter out undefined values for cleaner display
  const details: { label: string; value: string }[] = [
    { label: 'Transaction Hash', value: hash },
    { label: 'Block Hash', value: blockHash },
    { label: 'Block Number', value: blockNumber },
  ].filter((item): item is { label: string; value: string } => Boolean(item.value))

  // Common transaction details section to display hash, blockHash and blockNumber if they exist
  const renderTransactionDetails = () => {
    return (
      <div className="text-xs w-full">
        {details.map(
          item =>
            item.value && (
              <div key={item.label} className="flex justify-between items-center gap-1">
                <div className="text-xs text-muted-foreground mb-1">{item.label}</div>
                <AddressLink value={item.value} />
              </div>
            )
        )}
      </div>
    )
  }

  const { statusIcon, statusMessage } = getTransactionStatus(status, txStatusMessage, 'lg')

  return (
    <div className="w-full flex flex-col items-center space-y-4">
      {statusIcon}
      <span className="text-base font-medium max-w-[80%] text-center">
        {status === TransactionStatus.IS_LOADING ? 'Please sign the transaction in your Ledger device' : statusMessage}
      </span>
      {details.length > 0 && renderTransactionDetails()}
    </div>
  )
}

interface TransactionDialogFooterProps {
  isSignDisabled: boolean
  isTxFinished: boolean
  isTxFailed: boolean
  isSynchronizing: boolean
  clearTx: () => void
  synchronizeAccount: () => void
  closeDialog: () => void
  signTransfer: () => void
}

function TransactionDialogFooter({
  isTxFinished,
  isTxFailed,
  isSynchronizing,
  clearTx,
  synchronizeAccount,
  closeDialog,
  signTransfer,
  isSignDisabled,
}: TransactionDialogFooterProps) {
  return (
    <>
      <Button variant="outline" onClick={closeDialog}>
        {isTxFinished ? 'Close' : 'Cancel'}
      </Button>
      {!isTxFinished ? (
        <Button className="bg-[#7916F3] hover:bg-[#6B46C1] text-white" onClick={signTransfer} disabled={isSignDisabled}>
          Sign Transfer
        </Button>
      ) : (
        <Button
          className="bg-[#7916F3] hover:bg-[#6B46C1] text-white"
          onClick={isTxFailed ? clearTx : synchronizeAccount}
          disabled={isSynchronizing}
        >
          {isSynchronizing ? 'Synchronizing...' : isTxFailed ? 'Try again' : 'Update Synchronization'}
        </Button>
      )}
    </>
  )
}
export { TransactionDialogFooter, TransactionStatusBody }
