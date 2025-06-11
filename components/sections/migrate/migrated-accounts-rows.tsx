'use client'

import type { App } from 'state/ledger'
import type { Address, MultisigAddress } from 'state/types/ledger'

import { AddressLink } from '@/components/AddressLink'
import { CustomTooltip } from '@/components/CustomTooltip'
import { TableCell, TableRow } from '@/components/ui/table'
import { muifyHtml } from '@/lib/utils/html'
import { getTransactionStatus } from '@/lib/utils/ui'

import { useTokenLogo } from '@/components/hooks/useTokenLogo'
import { BalanceHoverCard } from './balance-hover-card'
import TransactionDropdown from './transaction-dropdown'

interface AccountRowsProps {
  app: App
  multisigAddresses?: boolean
}

const MigratedAccountRows = ({ app, multisigAddresses }: AccountRowsProps) => {
  const icon = useTokenLogo(app.id)
  const collections = app.collections

  const accounts = multisigAddresses ? app.multisigAccounts : app.accounts

  if (!accounts || accounts.length === 0) {
    return null
  }

  const renderStatusIcon = (account: Address, balanceIndex: number) => {
    const txStatus = account.balances?.[balanceIndex].transaction?.status
    const txStatusMessage = account.balances?.[balanceIndex].transaction?.statusMessage

    const { statusIcon, statusMessage } = getTransactionStatus(txStatus, txStatusMessage)

    return statusMessage ? <CustomTooltip tooltipBody={statusMessage}>{statusIcon}</CustomTooltip> : statusIcon
  }

  return accounts.map((account, accountIndex) => {
    return account.balances?.map((balance, balanceIndex) => (
      <TableRow key={`${app.id}-${account.address}-${accountIndex}-${balanceIndex}`}>
        <TableCell className="px-2 hidden sm:table-cell">
          <div className="max-h-8 overflow-hidden [&_svg]:max-h-8 [&_svg]:w-8 flex justify-center items-center">
            {icon && muifyHtml(icon)}
          </div>
        </TableCell>
        <TableCell>
          <AddressLink value={account.address} className="font-mono" tooltipBody={`${account.address} - ${account.path}`} />
        </TableCell>
        {!multisigAddresses && (
          <TableCell>
            <AddressLink
              value={account.pubKey !== '' ? account.pubKey : '-'}
              className="font-mono"
              hasCopyButton={account.pubKey !== ''}
              disableTooltip={account.pubKey === ''}
            />
          </TableCell>
        )}
        {multisigAddresses && (
          <TableCell>
            <AddressLink
              value={balance.transaction?.signatoryAddress || '-'}
              className="font-mono"
              hasCopyButton={!!balance.transaction?.signatoryAddress}
              disableTooltip={!balance.transaction?.signatoryAddress}
            />
          </TableCell>
        )}
        {multisigAddresses && (
          <TableCell>
            <span className="font-mono">
              {(account as MultisigAddress).threshold}/{(account as MultisigAddress).members.length}
            </span>
          </TableCell>
        )}
        <TableCell>
          <AddressLink value={balance.transaction?.destinationAddress || ''} className="font-mono" />
        </TableCell>
        <TableCell>
          <BalanceHoverCard balances={[balance]} collections={collections} token={app.token} isMigration />
        </TableCell>
        <TableCell>
          <div className="flex items-center space-x-2">
            {renderStatusIcon(account, balanceIndex)}
            {balance.transaction && <TransactionDropdown transaction={balance.transaction} />}
          </div>
        </TableCell>
      </TableRow>
    ))
  })
}

export default MigratedAccountRows
