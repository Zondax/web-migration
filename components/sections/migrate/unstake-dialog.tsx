import { useMemo, useState } from 'react'
import { ledgerState$ } from '@/state/ledger'
import { uiState$ } from '@/state/ui'
import { Address, Transaction, TransactionStatus } from 'state/types/ledger'

import { AppId, getChainName, Token } from '@/config/apps'
import { convertToRawUnits, formatBalance } from '@/lib/utils/format'
import { getTransactionStatus, isValidNumberInput } from '@/lib/utils/ui'
import { Button } from '@/components/ui/button'
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { AddressLink } from '@/components/AddressLink'
import { useTransactionStatus } from '@/components/hooks/useTransactionStatus'
import TokenIcon from '@/components/TokenIcon'

interface UnstakeDialogProps {
  appId: AppId
  open: boolean
  setOpen: (open: boolean) => void
  maxUnstake: number
  token: Token
  account: Address
}

interface UnstakeFormProps {
  unstakeAmount: number
  setUnstakeAmount: (amount: number) => void
  maxUnstake: number
  token: Token
  account: Address
  appId: AppId
}

function UnstakeStatusBody({ status, statusMessage: txStatusMessage, hash, blockHash, blockNumber }: Transaction) {
  if (!status) return null

  const details: { label: string; value: string | undefined }[] =
    hash || blockHash || blockNumber
      ? [
          { label: 'Transaction Hash', value: hash },
          { label: 'Block Hash', value: blockHash },
          { label: 'Block Number', value: blockNumber },
        ]
      : []

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

function UnstakeForm({ unstakeAmount, setUnstakeAmount, maxUnstake, token, account, appId }: UnstakeFormProps) {
  const icon = uiState$.icons.get()[token.logoId || '']
  const appName = getChainName(appId)

  return (
    <>
      <div>
        <div className="text-xs text-muted-foreground mb-1">Source Address</div>
        <AddressLink value={account.address} />
      </div>
      <div>
        <div className="text-xs text-muted-foreground mb-1">Network</div>
        <div className="flex items-center gap-2">
          <TokenIcon icon={icon} symbol={token.symbol} size="md" />
          <span className="font-semibold text-base">{appName}</span>
        </div>
      </div>
      <div>
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-muted-foreground">Amount to Unstake</span>
          <span className="text-xs text-muted-foreground">
            Max: {maxUnstake} {token.symbol}
          </span>
        </div>
        <Input
          type="number"
          min={0}
          max={maxUnstake}
          value={unstakeAmount}
          onChange={e => {
            const val = e.target.value
            if (isValidNumberInput(val)) setUnstakeAmount(Number(val))
          }}
          placeholder="Enter amount"
          className="font-mono"
        />
      </div>
    </>
  )
}

export default function UnstakeDialog({ open, setOpen, maxUnstake: maxUnstakeRaw, token, account, appId }: UnstakeDialogProps) {
  const [unstakeAmount, setUnstakeAmount] = useState<number>(0)
  const maxUnstake = useMemo(() => Number(formatBalance(maxUnstakeRaw, token, undefined, true)), [maxUnstakeRaw, token])

  // Wrap ledgerState$.unstakeBalance to match the generic hook's expected signature
  const unstakeTxFn = async (
    updateTxStatus: (
      status: TransactionStatus,
      message?: string,
      txDetails?: { txHash?: string; blockHash?: string; blockNumber?: string }
    ) => void,
    appId: AppId,
    address: string,
    path: string,
    amount: number
  ) => {
    await ledgerState$.unstakeBalance(appId, address, path, amount, updateTxStatus)
  }

  const { runTransaction, txStatus, clearTx, isTxFinished, isTxFailed, updateSynchronization, isSynchronizing } =
    useTransactionStatus(unstakeTxFn)

  const signUnstakeTx = async () => {
    const rawUnstakeAmount = convertToRawUnits(unstakeAmount, token)
    await runTransaction(appId, account.address, account.path, rawUnstakeAmount)
  }

  const synchronizeAccount = async () => {
    await updateSynchronization(ledgerState$.synchronizeAccount, appId)
    closeDialog()
  }

  const closeDialog = () => {
    setUnstakeAmount(0)
    clearTx()
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={closeDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Unstake and Transfer</DialogTitle>
          <DialogDescription>
            Unstake tokens from your balance to make them available for use. Enter the amount you wish to unstake below.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          {txStatus ? (
            <UnstakeStatusBody {...txStatus} />
          ) : (
            <UnstakeForm
              unstakeAmount={unstakeAmount}
              setUnstakeAmount={setUnstakeAmount}
              maxUnstake={maxUnstake}
              token={token}
              account={account}
              appId={appId}
            />
          )}
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={closeDialog}>
            {isTxFinished ? 'Close' : 'Cancel'}
          </Button>
          {!isTxFinished ? (
            <Button
              className="bg-[#7916F3] hover:bg-[#6B46C1] text-white"
              onClick={signUnstakeTx}
              disabled={
                !unstakeAmount ||
                !maxUnstake ||
                isNaN(Number(unstakeAmount)) ||
                Number(unstakeAmount) <= 0 ||
                Number(unstakeAmount) > maxUnstake ||
                Boolean(txStatus)
              }
            >
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
