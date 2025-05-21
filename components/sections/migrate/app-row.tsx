import { useCallback, useMemo, useState } from 'react'
import { BalanceType } from '@/state/types/ledger'
import { Observable } from '@legendapp/state'
import { observer, use$ } from '@legendapp/state/react'
import { AlertCircle, ChevronDown } from 'lucide-react'
import { App, AppStatus, ledgerState$ } from 'state/ledger'
import { uiState$ } from 'state/ui'

import { formatBalance } from '@/lib/utils/format'
import { muifyHtml } from '@/lib/utils/html'
import { Badge } from '@/components/ui/badge'
import { TableCell, TableRow } from '@/components/ui/table'
import { SimpleTooltip } from '@/components/ui/tooltip'
import { Spinner } from '@/components/icons'

import AccountsTable from './accounts-table'

function AppRow({ app, failedSync }: { app: Observable<App>; failedSync?: boolean }) {
  const name = use$(app.name)
  const id = use$(app.id)
  const status = use$(app.status)
  const accounts = use$(app.accounts)
  const collections = use$(app.collections)

  const [isExpanded, setIsExpanded] = useState(true)

  const icon = uiState$.icons.get()[id]

  const polkadotAddresses = useMemo(() => ledgerState$.polkadotAddresses[id].get(), [id])

  const toggleExpand = () => {
    setIsExpanded(!isExpanded)
  }

  const renderAction = useCallback(() => {
    if (failedSync) {
      if (status === AppStatus.RESCANNING) {
        return <Spinner />
      }

      return null
    }

    if (!status) {
      return null
    }
    switch (status) {
      case AppStatus.LOADING:
        return <Spinner />
      case AppStatus.MIGRATED:
        return (
          <Badge variant="destructive" className="capitalize">
            {status}
          </Badge>
        )
      default:
        return null
    }
  }, [status, failedSync])

  const renderBalance = () => {
    if (failedSync) return null
    const balance = accounts?.reduce((total, account) => {
      const balances = account.balances ?? []
      const nativeBalance = balances.find(b => b.type === BalanceType.NATIVE)?.balance ?? 0
      return total + nativeBalance
    }, 0)

    return balance !== undefined ? formatBalance(balance, app.token.get()) : '-'
  }

  return (
    <>
      <TableRow
        className={accounts?.length !== 0 ? 'cursor-pointer hover:bg-gray-50' : ''}
        onClick={accounts?.length !== 0 ? toggleExpand : undefined}
      >
        {/* Expand/Collapse Icon */}
        <TableCell className="px-2">
          <div className="flex justify-center items-center h-full">
            {accounts?.length !== 0 && <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />}
          </div>
        </TableCell>
        {/* App Icon */}
        <TableCell className="px-2 hidden sm:table-cell">
          <div className="max-h-8 overflow-hidden [&_svg]:max-h-8 [&_svg]:w-8">{muifyHtml(icon)}</div>
        </TableCell>
        {/* App Name */}
        <TableCell className="font-medium">{name}</TableCell>
        {/* Number of Accounts */}
        <TableCell className="font-medium">{accounts && accounts.length !== 0 ? accounts.length : '-'}</TableCell>
        {/* Balance */}
        <TableCell className="font-medium font-mono">{renderBalance()}</TableCell>
        {/* Action */}
        <TableCell>
          <div className="flex gap-2 justify-end items-center">
            {renderAction()}
            {app.error?.description?.get() && (
              <SimpleTooltip tooltipText={app.error?.description?.get()}>
                <AlertCircle className="h-4 w-4 text-destructive cursor-help" />
              </SimpleTooltip>
            )}
          </div>
        </TableCell>
      </TableRow>
      {/* Accounts Table */}
      {isExpanded && accounts?.length !== 0 ? (
        <AccountsTable
          accounts={app.accounts}
          token={app.token.get()}
          polkadotAddresses={polkadotAddresses ?? []}
          collections={collections}
        />
      ) : null}
    </>
  )
}

export default observer(AppRow)
