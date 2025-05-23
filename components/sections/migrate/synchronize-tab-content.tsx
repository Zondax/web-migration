'use client'

import { observable } from '@legendapp/state'
import { Info, RefreshCw } from 'lucide-react'
import { AppStatus } from 'state/ledger'

import { AddressLink } from '@/components/AddressLink'
import { useSynchronization } from '@/components/hooks/useSynchronization'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { SimpleTooltip, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

import AppRow from './app-row'

interface SynchronizeTabContentProps {
  onContinue: () => void
}

export function SynchronizeTabContent({ onContinue }: SynchronizeTabContentProps) {
  const {
    // State
    status,
    syncProgress,
    isRescaning,

    // Computed values
    hasAccountsWithErrors: accountsWithErrors,
    filteredAppsWithoutErrors: appsWithoutErrors,
    filteredAppsWithErrors: appsWithErrors,
    polkadotAddresses,

    // Actions
    rescanFailedAccounts,
    restartSynchronization,
  } = useSynchronization()

  const handleMigrate = () => {
    onContinue()
  }

  const renderDestinationAddressesInfo = () => {
    if (polkadotAddresses.length === 0) {
      return null
    }
    return (
      <div className="flex flex-col sm:flex-row items-start sm:items-center text-sm text-gray-600 gap-2 p-3 border border-polkadot-cyan rounded-md bg-polkadot-cyan bg-opacity-10">
        <Info className="h-5 w-5 sm:h-8 sm:w-8 text-polkadot-cyan flex-shrink-0" />
        <span>
          <TooltipProvider>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <span className="font-semibold cursor-help">Destination addresses</span>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                align="center"
                className={cn('min-w-[250px] z-[100] break-words whitespace-normal')}
                sideOffset={5}
              >
                <div className="max-w-xs">
                  <ul className="space-y-1">
                    {polkadotAddresses.slice(0, 5).map((address, index) => (
                      <li key={address} className="flex items-center gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">Polkadot {index + 1}:</span>
                          <AddressLink value={address} disableTooltip className="break-all" hasCopyButton />
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>{' '}
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
            <SimpleTooltip tooltipText="Synchronize Again">
              <Button onClick={restartSynchronization} variant="outline" className="flex items-center gap-1" disabled={isRescaning}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </SimpleTooltip>
          )}
          <Button onClick={handleMigrate} disabled={isLoading || appsWithoutErrors.length === 0} variant="purple">
            {isLoading ? 'Synchronizing...' : 'Migrate All'}
          </Button>
        </div>
      </div>
      <div className="hidden md:block mb-4">{renderDestinationAddressesInfo()}</div>

      {isLoading && (
        <div className="space-y-2 mb-8">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Synchronizing apps</span>
            <span className="text-sm text-gray-600">{syncProgress}%</span>
          </div>
          <Progress value={syncProgress} />
        </div>
      )}

      <Table className="shadow-sm border border-gray-200">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]" />
            <TableHead className="hidden w-[50px] sm:table-cell" />
            <TableHead className="w-[25%]">Chain</TableHead>
            <TableHead className="w-[25%]">Addresses</TableHead>
            <TableHead className="w-[25%]">Total Balance</TableHead>
            <TableHead className="w-[100px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {isSynchronized && appsWithoutErrors.length ? (
            appsWithoutErrors.map(app => <AppRow key={app.id.toString()} app={observable(app)} />)
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground p-4">
                {isSynchronized ? 'No accounts to migrate' : 'No synchronized accounts'}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {accountsWithErrors && (
        <>
          <div className="flex justify-between items-center mb-6 mt-6">
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"> </TableHead>
                <TableHead className="hidden w-[100px] sm:table-cell">
                  <span className="sr-only">Image</span>
                </TableHead>
                <TableHead className="w-[25%]">Name</TableHead>
                <TableHead className="w-[25%]">Addresses</TableHead>
                <TableHead className="w-[25%]" />
                <TableHead className="w-[100px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Filter and show only apps with error accounts */}
              {appsWithErrors.map(app => (
                <AppRow key={app.id.toString()} app={observable(app)} failedSync />
              ))}
            </TableBody>
          </Table>
        </>
      )}
    </div>
  )
}
