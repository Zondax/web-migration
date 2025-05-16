import { useCallback } from 'react'
import { Observable } from '@legendapp/state'
import { observer } from '@legendapp/state/react'
import { motion } from 'framer-motion'
import { AlertCircle, ChevronDown } from 'lucide-react'
import { Collections } from 'state/ledger'
import { Address, AddressBalance } from 'state/types/ledger'

import { Token } from '@/config/apps'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { SimpleTooltip } from '@/components/ui/tooltip'
import { AddressLink } from '@/components/AddressLink'
import { Spinner } from '@/components/icons'

import BalanceHoverCard from './balance-hover-card'
import DestinationAddressSelect from './destination-address-select'

function AccountsTable({
  accounts,
  token,
  polkadotAddresses,
  collections,
}: {
  accounts: Observable<Address[] | undefined>
  token: Token
  polkadotAddresses: string[]
  collections?: Collections
}) {
  const renderStatusIcon = (account: Address) => {
    let statusIcon
    let tooltipContent = 'Checking status...'

    if (account.isLoading) {
      statusIcon = <Spinner />
      tooltipContent = 'Loading...'
    }

    return statusIcon ? <SimpleTooltip tooltipText={tooltipContent}>{statusIcon}</SimpleTooltip> : null
  }

  const renderBalance = (balance: AddressBalance) => {
    return balance ? <BalanceHoverCard balance={balance} collections={collections} token={token} /> : null
  }

  const accountsList = accounts.get() ?? []

  const handleDestinationChange = useCallback(
    (value: string, accountIndex: number, balanceIndex: number) => {
      accounts[accountIndex].balances[balanceIndex].transaction.destinationAddress.set(value)
    },
    [accounts]
  )

  return (
    <TableRow>
      <TableCell colSpan={6} className="p-0">
        <motion.div
          className="bg-gray-100 px-4"
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
                <TableHead className="text-right">Balance</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accountsList.length > 0 ? (
                accountsList.map((account, accountIndex) => {
                  const balances = account.balances ?? []
                  return balances.map((balance: AddressBalance, balanceIndex: number) => {
                    const isFirst = balanceIndex === 0
                    const rowSpan = balances.length

                    return (
                      <TableRow key={`${account.address ?? accountIndex}-${balance.type}`}>
                        {/* Source Address */}
                        {isFirst && (
                          <TableCell className="py-2 text-sm w-1/4" rowSpan={rowSpan}>
                            <AddressLink
                              value={account.address ?? ''}
                              tooltipText={`${account.address ?? ''} - ${account.path ?? ''}`}
                              className="break-all"
                            />
                          </TableCell>
                        )}
                        {/* Public Key */}
                        {isFirst && (
                          <TableCell className="py-2 text-sm w-1/4" rowSpan={rowSpan}>
                            <AddressLink value={account.pubKey ?? ''} tooltipText={account.pubKey ?? ''} className="break-all" />
                          </TableCell>
                        )}
                        {/* Destination Address */}
                        <TableCell className="py-2 text-sm w-1/4">
                          <DestinationAddressSelect
                            balance={balance}
                            index={balanceIndex}
                            polkadotAddresses={polkadotAddresses}
                            onDestinationChange={value => handleDestinationChange(value, accountIndex, balanceIndex)}
                          />
                        </TableCell>
                        {/* Balance */}
                        <TableCell className="py-2 text-sm text-right w-1/4">{renderBalance(balance)}</TableCell>
                        {/* Actions */}
                        <TableCell>
                          <div className="flex gap-2 justify-end items-center">
                            {account.error?.description && (
                              <SimpleTooltip tooltipText={account.error?.description ?? ''}>
                                <AlertCircle className="h-4 w-4 text-destructive cursor-help" />
                              </SimpleTooltip>
                            )}
                            {renderStatusIcon(account)}
                            {balance.transaction?.hash && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <ChevronDown className="h-4 w-4 text-muted-foreground cursor-pointer" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="min-w-[300px]">
                                  <DropdownMenuItem className="gap-2">
                                    Transaction Hash:
                                    <AddressLink
                                      value={balance.transaction.hash ?? ''}
                                      tooltipText={balance.transaction.hash ?? ''}
                                      className="break-all"
                                    />
                                  </DropdownMenuItem>
                                  {balance.transaction.blockHash && (
                                    <DropdownMenuItem className="gap-2">
                                      Block Hash:
                                      <AddressLink
                                        value={balance.transaction.blockHash ?? ''}
                                        tooltipText={balance.transaction.blockHash ?? ''}
                                        className="break-all"
                                      />
                                    </DropdownMenuItem>
                                  )}
                                  {balance.transaction.blockNumber && (
                                    <DropdownMenuItem className="gap-2">
                                      Block Number:
                                      <AddressLink
                                        value={balance.transaction.blockNumber ?? ''}
                                        tooltipText={balance.transaction.blockNumber ?? ''}
                                        className="break-all"
                                      />
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No accounts to migrate
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </motion.div>
      </TableCell>
    </TableRow>
  )
}

export default observer(AccountsTable)
