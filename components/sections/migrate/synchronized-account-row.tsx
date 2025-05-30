import { observer } from '@legendapp/state/react'
import { AlertCircle, Info, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import type { Collections } from 'state/ledger'
import type { Address, AddressBalance } from 'state/types/ledger'

import { TableCell, TableRow } from '@/components/ui/table'
import { SimpleTooltip, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { AppId, Token } from '@/config/apps'
import { cn, formatBalance } from '@/lib/utils'
import { canUnstake, hasNonTransferableBalance, hasStakedBalance, isNativeBalance } from '@/lib/utils/balance'

import { AddressLink } from '@/components/AddressLink'
import { Spinner } from '@/components/icons'
import { Button, type ButtonVariant } from '@/components/ui/button'
import { BalanceHoverCard, LockedBalanceHoverCard } from './balance-hover-card'
import DestinationAddressSelect from './destination-address-select'
import UnstakeDialog from './unstake-dialog'
import WithdrawDialog from './withdraw-dialog'

// Component for rendering a single synchronized account row
interface AccountBalanceRowProps {
  account: Address
  accountIndex: number
  balance?: AddressBalance
  balanceIndex?: number
  rowSpan: number
  collections?: Collections
  token: Token
  polkadotAddresses: string[]
  handleDestinationChange: (value: string, accountIndex: number, balanceIndex: number) => void
  appId: AppId
}

interface Action {
  label: string
  tooltip?: string
  onClick: () => void
  disabled: boolean
  variant: ButtonVariant
}

const SynchronizedAccountRow = observer(
  ({
    account,
    accountIndex,
    balance,
    balanceIndex,
    rowSpan,
    collections,
    token,
    polkadotAddresses,
    handleDestinationChange,
    appId,
  }: AccountBalanceRowProps) => {
    const [unstakeOpen, setUnstakeOpen] = useState<boolean>(false)
    const [withdrawOpen, setWithdrawOpen] = useState<boolean>(false)
    const isNoBalance: boolean = balance === undefined
    const isFirst: boolean = balanceIndex === 0 || isNoBalance
    const isNative = isNativeBalance(balance)
    const hasStaked: boolean = isNative && hasStakedBalance(balance)
    const stakingActive: number | undefined = isNative ? (balance?.balance.staking?.active ?? 0) : undefined
    const maxUnstake: number = stakingActive ?? 0
    const isUnstakeAvailable: boolean = isNative ? canUnstake(balance) : false
    const totalBalance: number = isNative ? (balance?.balance.total ?? 0) : 0

    const actions: Action[] = []
    if (hasStaked) {
      actions.push({
        label: 'Unstake',
        tooltip: !isUnstakeAvailable ? 'Only the controller address can unstake this balance' : undefined,
        onClick: () => setUnstakeOpen(true),
        disabled: !isUnstakeAvailable,
        variant: 'secondary',
      })
    }
    const canWithdraw: boolean = isNative ? (balance?.balance.staking?.unlocking?.some(u => u.canWithdraw) ?? false) : false
    if (canWithdraw) {
      actions.push({
        label: 'Withdraw',
        tooltip: 'Withdraw the balance',
        onClick: () => setWithdrawOpen(true),
        disabled: false,
        variant: 'outline',
      })
    }

    const renderStatusIcon = (account: Address): React.ReactNode | null => {
      let statusIcon: React.ReactNode | null = null
      let tooltipContent = 'Checking status...'

      if (account.isLoading) {
        statusIcon = <Spinner />
        tooltipContent = 'Loading...'
      }

      return statusIcon ? <SimpleTooltip tooltipText={tooltipContent}>{statusIcon}</SimpleTooltip> : null
    }

    const renderLockedBalance = (balance: AddressBalance): React.ReactNode | null => {
      if (!balance) return null

      // Check if native balance has frozen funds or if transferable is less than total
      const isNative = isNativeBalance(balance)
      const hasNonTransferableBalanceWith: boolean = isNative && hasNonTransferableBalance(balance)

      return (
        <div className="flex flex-row items-center justify-end gap-2">
          <LockedBalanceHoverCard balance={isNative ? balance?.balance : undefined} token={token} />
          {hasNonTransferableBalanceWith && (
            <SimpleTooltip
              tooltipText={`Not all balance is transferable${actions.length > 0 ? ' - see available actions at the end of the row' : ''}`}
            >
              <TriangleAlert className="h-4 w-4 text-red-500" />
            </SimpleTooltip>
          )}
        </div>
      )
    }

    const renderTransferableBalance = () => {
      const transferableBalance: number = isNative ? (balance?.balance.transferable ?? 0) : 0
      const balances: AddressBalance[] = balance ? [balance] : []

      return (
        <div className="flex flex-row items-center justify-end gap-2">
          <span className="font-mono">{formatBalance(transferableBalance, token)}</span>
          {!isNative ? <BalanceHoverCard balances={balances} collections={collections} token={token} isMigration /> : null}
        </div>
      )
    }

    const tooltipAddres = (): React.ReactNode => (
      <div className="flex flex-col p-2 min-w-[320px]">
        {(
          [
            { label: 'Source Address', value: account.address },
            { label: 'Derivation Path', value: account.path },
            { label: 'Public Key', value: account.pubKey },
          ] as { label: string; value: string }[]
        ).map(item => (
          <div key={item.label}>
            <span className="text-xs text-muted-foreground">{item.label}</span>
            <AddressLink value={item.value} disableTooltip truncate={false} className="break-all" />
          </div>
        ))}
      </div>
    )

    const renderAction = (action: Action): React.ReactNode => {
      const button = (
        <Button key={action.label} variant={action.variant} size="sm" onClick={action.onClick} disabled={action.disabled}>
          {action.label}
        </Button>
      )
      return action.tooltip ? (
        <SimpleTooltip tooltipText={action.tooltip} key={action.label}>
          <div className="inline-block">{button}</div>
        </SimpleTooltip>
      ) : (
        button
      )
    }

    return (
      <TableRow key={`${account.address ?? accountIndex}-${balance?.type}`}>
        {/* Source Address */}
        {isFirst && (
          <TableCell className="py-2 text-sm" rowSpan={rowSpan}>
            <div className="flex items-center gap-2">
              <AddressLink value={account.address ?? ''} disableTooltip className="break-all" />
              <TooltipProvider>
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top" align="center" className={cn('z-[100] break-words whitespace-normal')} sideOffset={5}>
                    {tooltipAddres()}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </TableCell>
        )}
        {/* Destination Address */}
        <TableCell className="py-2 text-sm">
          {balance !== undefined && balanceIndex !== undefined ? (
            <DestinationAddressSelect
              balance={balance}
              index={balanceIndex}
              polkadotAddresses={polkadotAddresses}
              onDestinationChange={value => handleDestinationChange(value, accountIndex, balanceIndex)}
            />
          ) : (
            '-'
          )}
        </TableCell>
        {/* Total Balance */}
        <TableCell className="py-2 text-sm text-right w-1/4 font-mono">
          {balance !== undefined ? formatBalance(totalBalance, token) : '-'}
        </TableCell>
        {/* Transferable */}
        <TableCell className="py-2 text-sm text-right w-1/4">{balance !== undefined ? renderTransferableBalance() : '-'}</TableCell>
        {/* Locked */}
        <TableCell className="py-2 text-sm text-right w-1/4">{balance !== undefined ? renderLockedBalance(balance) : '-'}</TableCell>
        {/* Actions */}
        <TableCell>
          <div className="flex gap-2 justify-end items-center">
            {account.error?.description && (
              <SimpleTooltip tooltipText={account.error?.description ?? ''}>
                <AlertCircle className="h-4 w-4 text-destructive cursor-help" />
              </SimpleTooltip>
            )}
            {renderStatusIcon(account)}
          </div>
          {/* Additional Actions */}
          {actions.length > 0 ? (
            <div className="flex gap-2 justify-start items-center">{actions.map(action => renderAction(action))}</div>
          ) : null}
        </TableCell>
        <UnstakeDialog open={unstakeOpen} setOpen={setUnstakeOpen} maxUnstake={maxUnstake} token={token} account={account} appId={appId} />
        <WithdrawDialog open={withdrawOpen} setOpen={setWithdrawOpen} token={token} account={account} appId={appId} />
      </TableRow>
    )
  }
)

export default SynchronizedAccountRow
