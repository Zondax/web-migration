import { Observable } from '@legendapp/state'
import { observer } from '@legendapp/state/react'
import { motion } from 'framer-motion'
import { AlertCircle, ChevronDown } from 'lucide-react'
import { Collections } from 'state/ledger'
import { Address } from 'state/types/ledger'

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
  const handleDestinationChange = (value: string, accountIndex: number) => {
    accounts[accountIndex].destinationAddress.set(value)
  }

  const renderStatusIcon = (account: Observable<Address>) => {
    let statusIcon
    let tooltipContent = 'Checking status...'

    if (account.isLoading.get()) {
      statusIcon = <Spinner />
      tooltipContent = 'Loading...'
    }

    return statusIcon ? <SimpleTooltip tooltipText={tooltipContent}>{statusIcon}</SimpleTooltip> : null
  }

  const renderBalance = (account: Observable<Address>) => {
    const balance = account.balance.get()

    return balance ? <BalanceHoverCard balance={balance} collections={collections} token={token} /> : null
  }

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
              {accounts.length > 0 ? (
                accounts.map((account, index) => (
                  <TableRow key={account.address.get() || index}>
                    <TableCell className="py-2 text-sm w-1/4">
                      <AddressLink
                        value={account.address.get()}
                        tooltipText={`${account.address.get()} - ${account.path.get()}`}
                        className="break-all"
                      />
                    </TableCell>
                    <TableCell className="py-2 text-sm w-1/4">
                      <AddressLink value={account.pubKey.get()} tooltipText={account.pubKey.get()} className="break-all" />
                    </TableCell>
                    <TableCell className="py-2 text-sm w-1/4">
                      <DestinationAddressSelect
                        account={account}
                        index={index}
                        polkadotAddresses={polkadotAddresses}
                        onDestinationChange={handleDestinationChange}
                      />
                    </TableCell>
                    <TableCell className="py-2 text-sm text-right w-1/4">
                      <div className="flex items-center justify-end gap-2">{renderBalance(account)}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2 justify-end items-center">
                        {account.error.get() && (
                          <SimpleTooltip tooltipText={account.error.get()?.description}>
                            <AlertCircle className="h-4 w-4 text-destructive cursor-help" />
                          </SimpleTooltip>
                        )}
                        {renderStatusIcon(account)}

                        {account.transaction.get()?.hash && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <ChevronDown className="h-4 w-4 text-muted-foreground cursor-pointer" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="min-w-[300px]">
                              {/* Transaction Details */}
                              {account.transaction.get()?.hash && (
                                <DropdownMenuItem className="gap-2">
                                  Transaction Hash:
                                  <AddressLink
                                    value={account.transaction.get()?.hash ?? ''}
                                    tooltipText={account.transaction.get()?.hash}
                                    className="break-all"
                                  />
                                </DropdownMenuItem>
                              )}
                              {account.transaction.get()?.blockHash && (
                                <DropdownMenuItem className="gap-2">
                                  Block Hash:
                                  <AddressLink
                                    value={account.transaction.get()?.blockHash ?? ''}
                                    tooltipText={account.transaction.get()?.blockHash}
                                    className="break-all"
                                  />
                                </DropdownMenuItem>
                              )}
                              {account.transaction.get()?.blockNumber && (
                                <DropdownMenuItem className="gap-2">
                                  Block Number:
                                  <AddressLink
                                    value={account.transaction.get()?.blockNumber ?? ''}
                                    tooltipText={account.transaction.get()?.blockNumber}
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
                ))
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
