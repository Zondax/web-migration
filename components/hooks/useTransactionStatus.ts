import { type Transaction, TransactionStatus } from '@/state/types/ledger'
import { useCallback, useMemo, useState } from 'react'

import type { UpdateTransactionStatus } from '@/lib/account'

type GenericFunction = (...args: any[]) => Promise<void>

interface TransactionStatusReturn<T extends GenericFunction> {
  runTransaction: (...args: Parameters<T>) => Promise<void>
  txStatus: Transaction | undefined
  isTxFinished: boolean
  isTxFailed: boolean
  updateSynchronization: (syncFn?: GenericFunction, ...args: any[]) => Promise<void>
  isSynchronizing: boolean
  clearTx: () => void
}

/**
 * Generic hook for handling blockchain transactions with status tracking
 * @returns Functions for running a transaction and tracking its status
 */
export const useTransactionStatus = <T extends GenericFunction>(
  transactionFn: (updateTxStatus: UpdateTransactionStatus, ...args: Parameters<T>) => Promise<void>
): TransactionStatusReturn<T> => {
  // Track the status of transactions
  const [txStatus, setTxStatus] = useState<Transaction | undefined>(undefined)
  const [isTxFinished, setIsTxFinished] = useState<boolean>(false)
  const [isSynchronizing, setIsSynchronizing] = useState<boolean>(false)

  const isTxFailed = useMemo(() => {
    return Boolean(txStatus?.status && [TransactionStatus.FAILED, TransactionStatus.ERROR].includes(txStatus.status))
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
