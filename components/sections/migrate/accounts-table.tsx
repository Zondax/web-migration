import type { Observable } from '@legendapp/state'
import { observer } from '@legendapp/state/react'
import { motion } from 'framer-motion'
import { AlertCircle, Info, MoreVertical, TriangleAlert } from 'lucide-react'
import { useCallback, useState } from 'react'
import type { Collections } from 'state/ledger'
import type { Address, AddressBalance } from 'state/types/ledger'

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { SimpleTooltip } from '@/components/ui/tooltip'
import type { AppId, Token } from '@/config/apps'
import { formatBalance } from '@/lib/utils'
import { canUnstake, hasNonTransferableBalance, hasStakedBalance, isNativeBalance } from '@/lib/utils/balance'

import { AddressLink } from '@/components/AddressLink'
import { Spinner } from '@/components/icons'
import { BalanceHoverCard, LockedBalanceHoverCard } from './balance-hover-card'
import DestinationAddressSelect from './destination-address-select'
import UnstakeDialog from './unstake-dialog'

// Component for rendering a single account balance row
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

const AccountBalanceRow = observer(
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
    const [unstakeOpen, setUnstakeOpen] = useState(false)
    const isNoBalance = balance === undefined
    const isFirst = balanceIndex === 0 || isNoBalance
    const isNative = isNativeBalance(balance)
    const hasStaked = isNative && hasStakedBalance(balance)
    const stakingActive = isNative ? (balance?.balance.staking?.active ?? 0) : undefined
    const maxUnstake = stakingActive
    const isUnstakeAvailable = isNative ? canUnstake(balance) : false

    const actions = []
    if (hasStaked) {
      actions.push({
        label: 'Unstake',
        tooltip: !isUnstakeAvailable ? 'Only the controller address can unstake this balance' : undefined,
        onClick: () => setUnstakeOpen(true),
        disabled: !isUnstakeAvailable,
      })
    }

    const renderStatusIcon = (account: Address) => {
      let statusIcon: React.ReactNode | null = null
      let tooltipContent = 'Checking status...'

      if (account.isLoading) {
        statusIcon = <Spinner />
        tooltipContent = 'Loading...'
      }

      return statusIcon ? <SimpleTooltip tooltipText={tooltipContent}>{statusIcon}</SimpleTooltip> : null
    }

    const renderLockedBalance = (balance: AddressBalance) => {
      if (!balance) return null

      // Check if native balance has frozen funds or if transferable is less than total
      const isNative = isNativeBalance(balance)
      const hasNonTransferableBalanceWith = isNative && hasNonTransferableBalance(balance)

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
      const transferableBalance = isNative ? (balance?.balance.transferable ?? 0) : 0
      const balances = balance ? [balance] : []

      return (
        <div className="flex flex-row items-center justify-end gap-2">
          <span className="font-mono">{formatBalance(transferableBalance, token)}</span>
          {!isNative ? <BalanceHoverCard balances={balances} collections={collections} token={token} isMigration /> : null}
        </div>
      )
    }

    const totalBalance = isNative ? (balance?.balance.total ?? 0) : 0

    return (
      <TableRow key={`${account.address ?? accountIndex}-${balance?.type}`}>
        {/* Source Address */}
        {isFirst && (
          <TableCell className="py-2 text-sm" rowSpan={rowSpan}>
            <AddressLink
              value={account.address ?? ''}
              tooltipText={`${account.address ?? ''} - ${account.path ?? ''}`}
              className="break-all"
            />
          </TableCell>
        )}
        {/* Public Key */}
        {isFirst && (
          <TableCell className="py-2 text-sm" rowSpan={rowSpan}>
            <AddressLink value={account.pubKey ?? ''} tooltipText={account.pubKey ?? ''} className="break-all" />
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
          {actions.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <MoreVertical className="h-4 w-4 text-muted-foreground cursor-pointer" />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {actions.map(action => (
                  <div key={action.label} className={`flex flex-row items-center justify-between gap-2 ${action.tooltip ? 'mr-2' : ''}`}>
                    <DropdownMenuItem
                      key={action.label}
                      onClick={action.onClick}
                      disabled={action.disabled}
                      className={`flex gap-2 ${!action.tooltip ? 'w-full' : ''}`}
                    >
                      {action.label}
                    </DropdownMenuItem>
                    {action.tooltip && (
                      <SimpleTooltip tooltipText={action.tooltip}>
                        <Info className="h-4 w-4 cursor-help" />
                      </SimpleTooltip>
                    )}
                  </div>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </TableCell>
        <UnstakeDialog
          open={unstakeOpen}
          setOpen={setUnstakeOpen}
          maxUnstake={maxUnstake ?? 0}
          token={token}
          account={account}
          appId={appId}
        />
      </TableRow>
    )
  }
)

function AccountsTable({
  accounts,
  token,
  polkadotAddresses,
  collections,
  appId,
}: {
  accounts: Observable<Address[] | undefined>
  token: Token
  polkadotAddresses: string[]
  collections?: Collections
  appId: AppId
}) {
  const accountsList = accounts.get() ?? []

  const handleDestinationChange = useCallback(
    (value: string, accountIndex: number, balanceIndex: number) => {
      accounts[accountIndex].balances[balanceIndex].transaction.destinationAddress.set(value)
    },
    [accounts]
  )

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Table className="w-full">
        <TableHeader>
          <TableRow>
            <TableHead className="text-left">Source Address</TableHead>
            <TableHead className="text-left">Public Key</TableHead>
            <TableHead className="text-left">Destination Address</TableHead>
            <TableHead className="text-right">Total Balance</TableHead>
            <TableHead className="text-right">Transferable</TableHead>
            <TableHead className="text-right">Locked</TableHead>
            <TableHead className="w-[100px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {accountsList.length > 0 ? (
            accountsList.map((account, accountIndex) => {
              const balances = account.balances ?? []

              if (balances.length === 0 && account.error) {
                return (
                  <AccountBalanceRow
                    key={`${account.address ?? accountIndex}`}
                    account={account}
                    accountIndex={accountIndex}
                    rowSpan={balances.length}
                    collections={collections}
                    token={token}
                    polkadotAddresses={polkadotAddresses}
                    handleDestinationChange={handleDestinationChange}
                    appId={appId}
                  />
                )
              }

              return balances.map((balance: AddressBalance, balanceIndex: number) => (
                <AccountBalanceRow
                  key={`${account.address ?? accountIndex}-${balance.type}`}
                  account={account}
                  accountIndex={accountIndex}
                  balance={balance}
                  balanceIndex={balanceIndex}
                  rowSpan={balances.length}
                  collections={collections}
                  token={token}
                  polkadotAddresses={polkadotAddresses}
                  handleDestinationChange={handleDestinationChange}
                  appId={appId}
                />
              ))
            })
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                No accounts to migrate
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </motion.div>
  )
}

export default observer(AccountsTable)
