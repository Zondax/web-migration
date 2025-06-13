import type { Observable } from '@legendapp/state'
import { observer, use$ } from '@legendapp/state/react'
import { ChevronDown } from 'lucide-react'
import { useMemo, useState } from 'react'
import { type App, ledgerState$ } from 'state/ledger'
import { BalanceType } from 'state/types/ledger'
import { uiState$ } from 'state/ui'

import { isNativeBalance } from '@/lib/utils/balance'
import { formatBalance } from '@/lib/utils/format'
import { muifyHtml } from '@/lib/utils/html'

import AccountsTable from './accounts-table'
import { BalanceTypeFlag } from './balance-detail-card'

function SynchronizedApp({ app, appIndex, failedSync }: { app: Observable<App>; appIndex: number; failedSync?: boolean }) {
  const name = use$(app.name)
  const id = use$(app.id)
  const accounts = use$(app.accounts)
  const collections = use$(app.collections)

  const [isExpanded, setIsExpanded] = useState(true)

  const icon = uiState$.icons.get()[id]
  const polkadotAddresses = useMemo(() => ledgerState$.polkadotAddresses[id].get(), [id])
  const isAccountsNotEmpty = useMemo(() => Boolean(accounts && accounts.length !== 0), [accounts])

  const toggleExpand = () => {
    setIsExpanded(!isExpanded)
  }

  const totalBalance = useMemo(() => {
    if (failedSync) return null
    const balance = accounts?.reduce((total, account) => {
      const balances = account.balances ?? []
      const nativeBalance = balances.find(b => isNativeBalance(b))?.balance.total ?? 0
      return total + nativeBalance
    }, 0)

    return balance !== undefined ? formatBalance(balance, app.token.get()) : '-'
  }, [accounts, app.token, failedSync])

  const renderBalance = () =>
    totalBalance ? (
      <div className="flex items-center gap-2">
        <span className="font-bold text-base font-mono">{totalBalance}</span>
        <BalanceTypeFlag type={BalanceType.NATIVE} />
      </div>
    ) : null

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      isAccountsNotEmpty && toggleExpand()
    }
  }

  return (
    <div className="bg-gray-50 rounded-lg shadow-sm border border-gray-200 mb-4">
      <div
        className={`flex flex-row items-center justify-between gap-4 px-4 py-3 cursor-pointer select-none transition-colors rounded-lg ${accounts?.length !== 0 ? 'hover:bg-gray-50' : ''}`}
        onClick={isAccountsNotEmpty ? toggleExpand : undefined}
        onKeyDown={handleKeyDown}
        data-testid="app-row-overview"
      >
        <div className="flex items-center gap-4">
          <div className="max-h-8 w-8 h-8 overflow-hidden flex items-center justify-center">
            {/* Icon */}
            {muifyHtml(icon)}
          </div>
          <div className="flex flex-col">
            {/* Name */}
            <div className="font-bold text-lg leading-tight">{name}</div>
            {/* Address count */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-gray-500 text-sm">
              <span>
                {accounts?.length || 0} address{accounts?.length === 1 ? '' : 'es'}
              </span>
            </div>
            <div className="flex items-center gap-2 sm:hidden">{renderBalance()}</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Balance */}
          <div className="flex flex-col items-end min-w-[120px] hidden sm:flex">{renderBalance()}</div>
          {/* Expand/Collapse Icon */}
          {isAccountsNotEmpty && (
            <div className="flex items-center ml-2">
              <ChevronDown className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </div>
          )}
        </div>
      </div>
      {/* Accounts Table (expandable) */}
      {isExpanded && isAccountsNotEmpty ? (
        <div className="overflow-hidden">
          <AccountsTable
            accounts={app.accounts}
            token={app.token.get()}
            polkadotAddresses={polkadotAddresses ?? []}
            collections={collections}
            appId={id}
            appIndex={appIndex}
          />
        </div>
      ) : null}
    </div>
  )
}

export default observer(SynchronizedApp)
