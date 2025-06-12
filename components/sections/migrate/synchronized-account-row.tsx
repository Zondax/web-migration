import { observer } from '@legendapp/state/react'
import { AlertCircle, BanknoteArrowDown, Info, KeyRound, LockOpen, Route, Trash2, TriangleAlert, User } from 'lucide-react'
import { useState } from 'react'
import type { Collections } from 'state/ledger'
import type { Address, AddressBalance } from 'state/types/ledger'

import { CustomTooltip, TooltipBody } from '@/components/CustomTooltip'
import { TableCell, TableRow } from '@/components/ui/table'
import type { AppId, Token } from '@/config/apps'
import { formatBalance } from '@/lib/utils'
import { canUnstake, hasNonTransferableBalance, hasStakedBalance, isNativeBalance } from '@/lib/utils/balance'

import { ExplorerLink } from '@/components/ExplorerLink'
import { Spinner } from '@/components/icons'
import { Button, type ButtonVariant } from '@/components/ui/button'
import { ExplorerItemType } from '@/config/explorers'
import { getIdentityItems } from '@/lib/utils/ui'
import { BalanceHoverCard, LockedBalanceHoverCard } from './balance-hover-card'
import DestinationAddressSelect from './destination-address-select'
import RemoveIdentityDialog from './remove-identity-dialog'
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
  icon?: React.ReactNode
  variant?: ButtonVariant
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
    const [removeIdentityOpen, setRemoveIdentityOpen] = useState<boolean>(false)
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
        tooltip: !isUnstakeAvailable ? 'Only the controller address can unstake this balance' : 'Unlock your staked assets',
        onClick: () => setUnstakeOpen(true),
        disabled: !isUnstakeAvailable,
        icon: <LockOpen className="h-4 w-4" />,
      })
    }
    const canWithdraw: boolean = isNative ? (balance?.balance.staking?.unlocking?.some(u => u.canWithdraw) ?? false) : false
    if (canWithdraw) {
      actions.push({
        label: 'Withdraw',
        tooltip: 'Move your unlocked assets to your available balance',
        onClick: () => setWithdrawOpen(true),
        disabled: false,
        icon: <BanknoteArrowDown className="h-4 w-4" />,
      })
    }

    if (account.registration?.identity) {
      const identityItems = getIdentityItems(account.registration)
      if (identityItems.length > 0) {
        actions.push({
          label: 'Identity',
          tooltip: account.registration?.canRemove
            ? 'Remove account identity'
            : 'Account identity cannot be removed because it has a parent account',
          onClick: () => setRemoveIdentityOpen(true),
          disabled: !account.registration?.canRemove,
          icon: <Trash2 className="h-4 w-4" />,
        })
      }
    }

    const renderStatusIcon = (account: Address): React.ReactNode | null => {
      let statusIcon: React.ReactNode | null = null
      let tooltipContent = 'Checking status...'

      if (account.isLoading) {
        statusIcon = <Spinner />
        tooltipContent = 'Loading...'
      }

      return statusIcon ? <CustomTooltip tooltipBody={tooltipContent}>{statusIcon}</CustomTooltip> : null
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
            <CustomTooltip
              tooltipBody={`Not all balance is transferable${actions.length > 0 ? ' - see available actions at the end of the row' : ''}`}
            >
              <TriangleAlert className="h-4 w-4 text-red-500" />
            </CustomTooltip>
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
      <div className="p-2 min-w-[320px]">
        <TooltipBody
          items={[
            { label: 'Source Address', value: account.address, icon: User, hasCopyButton: true },
            { label: 'Derivation Path', value: account.path, icon: Route },
            { label: 'Public Key', value: account.pubKey, icon: KeyRound, hasCopyButton: true },
          ]}
        />
      </div>
    )

    const tooltipIdentity = (): React.ReactNode => {
      if (!account.registration?.identity) return null
      return (
        <div className="p-2 min-w-[240px]">
          <TooltipBody items={getIdentityItems(account.registration)} />
        </div>
      )
    }
    const renderAction = (action: Action): React.ReactNode => {
      const button = (
        <Button key={action.label} variant={action.variant ?? 'secondary'} size="sm" onClick={action.onClick} disabled={action.disabled}>
          {action.icon}
          {action.label}
        </Button>
      )
      return action.tooltip ? (
        <CustomTooltip tooltipBody={action.tooltip} key={action.label}>
          <div className="inline-block">{button}</div>
        </CustomTooltip>
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
              <ExplorerLink
                value={account.address ?? ''}
                appId={appId}
                explorerLinkType={ExplorerItemType.Address}
                disableTooltip
                className="break-all"
              />
              {/* Identity Icon and Tooltip */}
              {account.registration?.identity ? (
                <CustomTooltip tooltipBody={tooltipIdentity()}>
                  <User className="h-4 w-4 text-polkadot-pink" />
                </CustomTooltip>
              ) : null}
              {/* Address Info Icon and Tooltip */}
              <CustomTooltip tooltipBody={tooltipAddres()}>
                <Info className="h-4 w-4 text-muted-foreground" />
              </CustomTooltip>
            </div>
          </TableCell>
        )}
        {/* Destination Address */}
        <TableCell className="py-2 text-sm">
          {balance !== undefined && balanceIndex !== undefined ? (
            <DestinationAddressSelect
              appId={appId}
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
              <CustomTooltip tooltipBody={account.error?.description ?? ''}>
                <AlertCircle className="h-4 w-4 text-destructive cursor-help" />
              </CustomTooltip>
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
        <RemoveIdentityDialog open={removeIdentityOpen} setOpen={setRemoveIdentityOpen} token={token} account={account} appId={appId} />
      </TableRow>
    )
  }
)

export default SynchronizedAccountRow
