'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { observer, use$ } from '@legendapp/state/react'
import { AlertCircle, CheckCircle, Clock, Info, ShieldCheck, XCircle } from 'lucide-react'
import { App } from 'state/ledger'
import { Address, TransactionStatus } from 'state/types/ledger'
import { uiState$ } from 'state/ui'

import { muifyHtml } from '@/lib/utils/html'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { SimpleTooltip } from '@/components/ui/tooltip'
import { AddressLink } from '@/components/AddressLink'
import { useMigration } from '@/components/hooks/useMigration'
import { Spinner } from '@/components/icons'

import { AddressVerificationDialog } from './address-verification-dialog'
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
        case TransactionStatus.PENDING:
          statusIcon = <Clock className="h-4 w-4 text-muted-foreground" />
          tooltipContent = 'Transaction pending...'
          break
        case TransactionStatus.IN_BLOCK:
          statusIcon = <Clock className="h-4 w-4 text-muted-foreground" />
          break
        case TransactionStatus.FINALIZED:
          statusIcon = <Clock className="h-4 w-4 text-muted-foreground" />
          break
        case TransactionStatus.SUCCESS:
          statusIcon = <CheckCircle className="h-4 w-4 text-green-500" />
          break
        case TransactionStatus.FAILED:
          statusIcon = <XCircle className="h-4 w-4 text-red-500" />
          break
        case TransactionStatus.ERROR:
          statusIcon = <AlertCircle className="h-4 w-4 text-red-500" />
          break
        case TransactionStatus.WARNING:
          statusIcon = <AlertCircle className="h-4 w-4 text-yellow-500" />
          break
        case TransactionStatus.COMPLETED:
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
              <div className="max-h-8 overflow-hidden [&_svg]:max-h-8 [&_svg]:w-8 flex justify-center items-center">
                {icon && muifyHtml(icon)}
              </div>
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
              <BalanceHoverCard balance={account.balance!} collections={collections} token={app.token} />
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
  const [showVerificationDialog, setShowVerificationDialog] = useState(false)
  const [migrationStatus, setMigrationStatus] = useState<undefined | 'loading' | 'finished'>()
  const { filteredAppsWithoutErrors, migrateAll, migrationResults, restartSynchronization, allVerified, verifyDestinationAddresses } =
    useMigration()

  const handleMigrate = async () => {
    setMigrationStatus('loading')
    await migrateAll()
    setShowSuccessDialog(true)
    setMigrationStatus('finished')
  }

  const handleReturnHome = () => {
    setShowSuccessDialog(false)
    setMigrationStatus(undefined)
    router.push('/')
  }

  const handleRestartSynchronization = () => {
    restartSynchronization()
    onBack()
  }

  const handleOpenVerificationDialog = () => {
    setShowVerificationDialog(true)
    verifyDestinationAddresses()
  }

  const hasAddressesToVerify = filteredAppsWithoutErrors.length > 0

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Migrate Accounts</h2>
        <p className="text-gray-600">Review your accounts and verify addresses before migration.</p>
        {allVerified && (
          <div className="mt-2 flex items-center gap-2 text-green-600">
            <ShieldCheck className="h-5 w-5" />
            <span>All addresses have been verified successfully</span>
          </div>
        )}
      </div>

      <Table className="shadow-sm border border-gray-200">
        <TableHeader>
          <TableRow>
            <TableHead className="hidden sm:table-cell">Chain</TableHead>
            <TableHead>Source Address</TableHead>
            <TableHead>Public Key</TableHead>
            <TableHead>Destination Address</TableHead>
            <TableHead className="flex items-center">
              Balance
              <SimpleTooltip
                tooltipText="Balance to be transferred. The transaction fee will be deducted from this amount."
                className="!normal-case"
              >
                <Info className="h-4 w-4 inline-block ml-1 text-gray-400" />
              </SimpleTooltip>
            </TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredAppsWithoutErrors.length > 0 ? (
            filteredAppsWithoutErrors.map(app => <MigrateRow key={app.id?.toString()} app={app} />)
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground p-4">
                No accounts to migrate
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <div className="flex justify-center gap-4 mt-8">
        {migrationStatus === 'finished' ? (
          <>
            <Button variant="outline" onClick={handleRestartSynchronization}>
              Synchronize Again
            </Button>
            <Button variant="purple" size="wide" onClick={handleReturnHome}>
              Go Home
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" onClick={onBack}>
              Back
            </Button>
            <Button
              variant="purple"
              onClick={handleOpenVerificationDialog}
              disabled={!hasAddressesToVerify || allVerified}
              className="flex items-center gap-2"
            >
              <ShieldCheck className="h-4 w-4" />
              {allVerified ? 'Addresses Verified' : 'Verify Addresses'}
            </Button>
            <Button
              variant="purple"
              size="wide"
              onClick={handleMigrate}
              disabled={filteredAppsWithoutErrors.length === 0 || !allVerified || migrationStatus === 'loading'}
            >
              {migrationStatus === 'loading' ? 'Migrating...' : 'Migrate Accounts'}
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

      {/* Address Verification Dialog */}
      <AddressVerificationDialog open={showVerificationDialog} onClose={() => setShowVerificationDialog(false)} />
    </div>
  )
}
