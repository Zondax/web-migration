import type { Observable } from '@legendapp/state'
import { observer } from '@legendapp/state/react'
import { motion } from 'framer-motion'
import { useCallback } from 'react'
import type { Collections } from 'state/ledger'
import type { Address, AddressBalance } from 'state/types/ledger'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { AppId, Token } from '@/config/apps'

import SynchronizedAccountRow from './synchronized-account-row'

interface AccountsTableProps {
  accounts: Observable<Address[] | undefined>
  token: Token
  polkadotAddresses: string[]
  collections?: Collections
  appId: AppId
}

function AccountsTable({ accounts, token, polkadotAddresses, collections, appId }: AccountsTableProps) {
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
            <TableHead className="text-left">Destination Address</TableHead>
            <TableHead className="text-right">Total Balance</TableHead>
            <TableHead className="text-right">Transferable</TableHead>
            <TableHead className="text-right">Locked</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {accountsList.length > 0 ? (
            accountsList.map((account, accountIndex) => {
              const balances = account.balances ?? []

              if (balances.length === 0 && account.error) {
                return (
                  <SynchronizedAccountRow
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
                <SynchronizedAccountRow
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
              <TableCell colSpan={7} className="text-center text-muted-foreground">
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
