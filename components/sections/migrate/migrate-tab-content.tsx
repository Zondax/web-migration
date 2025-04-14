'use client'

import { observer, use$ } from '@legendapp/state/react'
import { AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { App } from 'state/ledger'
import { Address } from 'state/types/ledger'
import { uiState$ } from 'state/ui'

import { AddressLink } from '@/components/AddressLink'
import { useMigration } from '@/components/hooks/useMigration'
import { Spinner } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { SimpleTooltip } from '@/components/ui/tooltip'
import { muifyHtml } from '@/lib/utils/html'

import BalanceHoverCard from './balance-hover-card'
import { SuccessDialog } from './success-dialog'
import TransactionDropdown from './transaction-dropdown'

interface MigrateTabContentProps {
  onBack: () => void
  onContinue: () => void
}

interface MigrateRowProps {
  app: App
}

const MigrateRow = observer(({ app }: MigrateRowProps) => {
  const icon = use$(uiState$.icons.get())[app.id]
  const collections = use$(app.collections)

  // If there are no accounts, render a placeholder row
  if (!app.accounts || app.accounts.length === 0) {
    return null
  }

  const renderStatusIcon = (account: Address) => {
    const txStatus = account.transaction?.status
    const txStatusMessage = account.transaction?.statusMessage
    let statusIcon
    let tooltipContent = txStatusMessage

    if (account.isLoading) {
      statusIcon = <Spinner />
      tooltipContent = 'Loading...'
    } else if (account.error) {
      statusIcon = <AlertCircle className="h-4 w-4 text-red-500" />
      tooltipContent = account.error.description
    } else {
      switch (txStatus) {
        case 'pending':
          statusIcon = <Clock className="h-4 w-4 text-muted-foreground" />
          tooltipContent = 'Transaction pending...'
          break
        case 'inBlock':
          statusIcon = <Clock className="h-4 w-4 text-muted-foreground" />
          break
        case 'finalized':
          statusIcon = <Clock className="h-4 w-4 text-muted-foreground" />
          break
        case 'success':
          statusIcon = <CheckCircle className="h-4 w-4 text-green-500" />
          break
        case 'failed':
          statusIcon = <XCircle className="h-4 w-4 text-red-500" />
          break
        case 'error':
          statusIcon = <AlertCircle className="h-4 w-4 text-red-500" />
          break
        case 'warning':
          statusIcon = <AlertCircle className="h-4 w-4 text-yellow-500" />
          break
        case 'completed':
          statusIcon = <Clock className="h-4 w-4 text-muted-foreground" />
          break
        default:
          statusIcon = <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Ready to migrate</span>
      }
    }

    return tooltipContent ? <SimpleTooltip tooltipText={tooltipContent}>{statusIcon}</SimpleTooltip> : statusIcon
  }

  // Render a row for each account in the app
  return (
    <>
      {app.accounts
        .filter(
          account =>
            account.balance &&
            (account.balance.native !== 0 ||
              (account.balance.nfts && account.balance.nfts?.length !== 0) ||
              (account.balance.uniques && account.balance.uniques?.length !== 0)) &&
            account.destinationAddress
        )
        .map((account, index) => (
          <TableRow key={`${app.id}-${account.address}-${index}`}>
            <TableCell className="px-2 hidden sm:table-cell">
              {index === 0 && (
                <div className="max-h-8 overflow-hidden [&_svg]:max-h-8 [&_svg]:w-8 flex justify-center items-center">
                  {icon && muifyHtml(icon)}
                </div>
              )}
            </TableCell>
            <TableCell>
              <AddressLink value={account.address} className="font-mono" tooltipText={`${account.address} - ${account.path}`} />
            </TableCell>
            <TableCell>
              <AddressLink value={account.pubKey} className="font-mono" />
            </TableCell>
            <TableCell>
              <AddressLink value={account.destinationAddress!} className="font-mono" />
            </TableCell>
            <TableCell>
              <BalanceHoverCard
                balance={account.balance!}
                collections={collections}
                ticker={app.ticker}
                decimals={app.decimals}
                tokenIconId={app.tokenIconId ?? app.id}
              />
            </TableCell>
            <TableCell>
              <div className="flex items-center space-x-2">
                {renderStatusIcon(account)}
                {account.transaction && <TransactionDropdown transaction={account.transaction} />}
              </div>
            </TableCell>
          </TableRow>
        ))}
    </>
  )
})

export function MigrateTabContent({ onBack }: MigrateTabContentProps) {
  const router = useRouter()
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const { filteredAppsWithoutErrors, migrateAll, migrationResults, restartSynchronization } = useMigration()

  const handleMigrate = async () => {
    await migrateAll()
    setShowSuccessDialog(true)
  }

  const handleReturnHome = () => {
    setShowSuccessDialog(false)
    router.push('/')
  }

  const handleRestartSynchronization = () => {
    restartSynchronization()
    onBack()
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Migrate Accounts</h2>
        <p className="text-gray-600">Review your accounts and click Migrate to complete the process.</p>
      </div>

      <Table className="shadow-sm border border-gray-200">
        <TableHeader>
          <TableRow>
            <TableHead className="hidden sm:table-cell">Chain</TableHead>
            <TableHead>Source Address</TableHead>
            <TableHead>Public Key</TableHead>
            <TableHead>Destination Address</TableHead>
            <TableHead>Balance</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredAppsWithoutErrors.length > 0 ? (
            filteredAppsWithoutErrors.map(app => <MigrateRow key={app.id?.toString()} app={app} />)
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground p-4">
                No accounts to migrate
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <div className="flex justify-center gap-4 mt-8">
        {!migrationResults.success && !migrationResults.total ? (
          <>
            <Button variant="outline" onClick={onBack}>
              Back
            </Button>
            <Button variant="purple" size="wide" onClick={handleMigrate} disabled={filteredAppsWithoutErrors.length === 0}>
              Migrate Accounts
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" onClick={handleRestartSynchronization}>
              Synchronize Again
            </Button>
            <Button variant="purple" size="wide" onClick={handleReturnHome}>
              Go Home
            </Button>
          </>
        )}
      </div>

      {/* Success Dialog */}
      <SuccessDialog
        open={showSuccessDialog}
        onClose={() => setShowSuccessDialog(false)}
        onReturn={handleReturnHome}
        successCount={migrationResults.success}
        totalCount={migrationResults.total}
      />
    </div>
  )
}
