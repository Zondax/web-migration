import { useCallback, useMemo, useState } from 'react'
import { Transaction, TransactionStatus } from '@/state/types/ledger'

import { UpdateTransactionStatus } from '@/lib/account'

/**
 * Generic hook for handling blockchain transactions with status tracking
 * @returns Functions for running a transaction and tracking its status
 */
export const useTransactionStatus = <T extends (...args: any[]) => Promise<any>>(
  transactionFn: (updateTxStatus: UpdateTransactionStatus, ...args: Parameters<T>) => Promise<void>
) => {
  // Track the status of transactions
  const [txStatus, setTxStatus] = useState<Transaction | undefined>(undefined)
  const [isTxFinished, setIsTxFinished] = useState<boolean>(false)
  const [isSynchronizing, setIsSynchronizing] = useState<boolean>(false)

  const isTxFailed = useMemo(() => {
    return txStatus?.status && [TransactionStatus.FAILED, TransactionStatus.ERROR].includes(txStatus.status)
  }, [txStatus])

  /**
   * Updates the transaction status for a specific operation
   */
  const updateTxStatus: UpdateTransactionStatus = useCallback((status, message, txDetails) => {
    setTxStatus(prev => ({
      ...prev,
      status: status,
      statusMessage: message,
      hash: txDetails?.txHash,
      blockHash: txDetails?.blockHash,
      blockNumber: txDetails?.blockNumber,
    }))
  }, [])

  // Run a generic transaction
  const runTransaction = useCallback(
    async (...args: Parameters<T>) => {
      setTxStatus({
        status: TransactionStatus.IS_LOADING,
      })
      await transactionFn(updateTxStatus, ...args)
      setIsTxFinished(true)
    },
    [transactionFn, updateTxStatus]
  )

  // Optionally, provide a synchronization function if needed
  const updateSynchronization = useCallback(async (syncFn?: (...args: any[]) => Promise<any>, ...args: any[]) => {
    if (!syncFn) return
    setIsSynchronizing(true)
    await syncFn(...args)
    setIsSynchronizing(false)
  }, [])

  const clearTx = useCallback(() => {
    setTxStatus(undefined)
    setIsTxFinished(false)
  }, [])

  return {
    runTransaction,
    txStatus,
    isTxFinished,
    isTxFailed,
    updateSynchronization,
    isSynchronizing,
    clearTx,
  }
}
