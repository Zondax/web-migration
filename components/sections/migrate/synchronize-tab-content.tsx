'use client'

import { observable } from '@legendapp/state'
import { FolderSync, Info, Loader2, RefreshCw, X } from 'lucide-react'
import { useCallback, useMemo } from 'react'
import { AppStatus } from 'state/ledger'

import { CustomTooltip } from '@/components/CustomTooltip'
import { ExplorerLink } from '@/components/ExplorerLink'
import { useMigration } from '@/components/hooks/useMigration'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'

import { useSynchronization } from '@/components/hooks/useSynchronization'
import type { CheckedState } from '@radix-ui/react-checkbox'
import AppScanningGrid from './app-scanning-grid'
import EmptyStateRow from './empty-state-row'
import AppRow from './synchronized-app'

interface SynchronizeTabContentProps {
  onContinue: () => void
}

export function SynchronizeTabContent({ onContinue }: SynchronizeTabContentProps) {
  const {
    // State
    status,
    syncProgress,
    isRescaning,
    isSyncCancelRequested,

    // Computed values
    hasAccountsWithErrors: accountsWithErrors,
    filteredAppsWithoutErrors: appsWithoutErrors,
    filteredAppsWithErrors: appsWithErrors,
    polkadotAddresses,

    // Actions
    rescanFailedAccounts,
    restartSynchronization,
    cancelSynchronization,
  } = useSynchronization()

  // Get selection functions from useMigration
  const { toggleAllAccounts } = useMigration()

  const handleMigrate = () => {
    onContinue()
  }

  // Check if all apps are selected
  const areAllAppsSelected = useMemo(() => {
    if (appsWithoutErrors.length === 0) return false
    return appsWithoutErrors.every(app => app.accounts?.every(account => account.selected))
  }, [appsWithoutErrors])

  // Handle "Select All" checkbox change
  const handleSelectAllChange = useCallback(
    (checked: CheckedState) => {
      toggleAllAccounts(Boolean(checked))
    },
    [toggleAllAccounts]
  )

  const renderDestinationAddressesInfo = () => {
    if (polkadotAddresses.length === 0) {
      return null
    }
    return (
      <div className="flex flex-col sm:flex-row items-start sm:items-center text-sm text-gray-600 gap-2 p-3 border border-polkadot-cyan rounded-lg bg-polkadot-cyan bg-opacity-10">
        <Info className="h-5 w-5 sm:h-8 sm:w-8 text-polkadot-cyan flex-shrink-0" />
        <span>
          <CustomTooltip
            tooltipBody={
              <div className="max-w-xs">
                <ul className="space-y-1">
                  {polkadotAddresses.slice(0, 5).map((address, index) => (
                    <li key={address} className="flex items-center gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">Polkadot {index + 1}:</span>
                        <ExplorerLink value={address} disableTooltip className="break-all" hasCopyButton />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            }
            className="min-w-[250px]"
          >
            <span className="font-semibold cursor-help">Destination addresses</span>
          </CustomTooltip>{' '}
          come from the Polkadot HD path. These addresses are shown with different encodings based on each network&apos;s unique prefix, so
          the same key looks different depending on the network. You will have to verify all addresses before migration for security
          reasons.
        </span>
      </div>
    )
  }

  const isLoading = status === AppStatus.LOADING
  const isSynchronized = status === AppStatus.SYNCHRONIZED

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start gap-6 md:gap-4 mb-6 md:mb-4 ">
        <div className="w-full md:w-auto">
          <h2 className="text-2xl font-bold">Synchronized Accounts</h2>
          <p className="text-gray-600">Click Migrate All to start migrating your accounts.</p>
          <div className="md:hidden mt-2">{renderDestinationAddressesInfo()}</div>
        </div>
        <div className="flex gap-2 self-start">
          {status !== AppStatus.LOADING && (
            <CustomTooltip tooltipBody="Synchronize Again">
              <Button onClick={restartSynchronization} variant="outline" className="flex items-center gap-1" disabled={isRescaning}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </CustomTooltip>
          )}

          {isLoading ? (
            <Button
              onClick={cancelSynchronization}
              variant="destructive"
              className="flex items-center gap-1"
              disabled={isSyncCancelRequested}
            >
              {isSyncCancelRequested ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />} Stop Synchronization
            </Button>
          ) : (
            <Button onClick={handleMigrate} disabled={isLoading || appsWithoutErrors.length === 0} variant="purple">
              Migrate
            </Button>
          )}
        </div>
      </div>
      <div className="hidden md:block mb-4">{renderDestinationAddressesInfo()}</div>

      {/* Show apps scanning status */}
      <div className="space-y-2 mb-8">
        {isLoading && (
          <>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">
                Synchronizing apps {syncProgress.total > 0 && `(${syncProgress.scanned} / ${syncProgress.total})`}
              </span>
              <span className="text-sm text-gray-600">{syncProgress.percentage}%</span>
            </div>
            <Progress value={syncProgress.percentage} />
            <div className="pt-2">
              <AppScanningGrid />
            </div>
          </>
        )}
      </div>

      {!isLoading && isSynchronized && appsWithoutErrors.length > 0 && (
        <div className="flex items-center mb-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <Checkbox id="select-all-checkbox" checked={areAllAppsSelected} onCheckedChange={handleSelectAllChange} />
            <label htmlFor="select-all-checkbox" className="ml-2 text-sm font-medium cursor-pointer">
              Select All Accounts
            </label>
          </div>
        </div>
      )}

      {!isLoading &&
        (isSynchronized && appsWithoutErrors.length ? (
          appsWithoutErrors.map((app, index) => <AppRow key={app.id.toString()} app={observable(app)} appIndex={index} />)
        ) : (
          <EmptyStateRow
            label={
              isSynchronized
                ? 'There are no accounts available for migration. Please make sure your Ledger device contains accounts with a balance to migrate.'
                : 'No accounts with funds have been synchronized yet.'
            }
            icon={<FolderSync className="h-8 w-8 text-gray-300" />}
          />
        ))}

      {isSynchronized && accountsWithErrors && (
        <>
          <div className="flex justify-between items-start gap-2 mb-6 mt-6">
            <div>
              <h2 className="text-2xl font-bold">Failed Synchronization</h2>
              <p className="text-gray-600">
                The account couldn&apos;t be scanned successfully. Please try again or continue with the successfully scanned accounts.
              </p>
            </div>
            <Button onClick={rescanFailedAccounts} variant="purple">
              {isRescaning ? 'Loading...' : 'Rescan'}
            </Button>
          </div>
          {/* Filter and show only apps with error accounts */}
          {appsWithErrors.map((app, index) => (
            <AppRow key={app.id.toString()} app={observable(app)} appIndex={appsWithoutErrors.length + index} failedSync />
          ))}
        </>
      )}
    </div>
  )
}
