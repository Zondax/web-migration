'use client';

import { useSynchronization } from '@/components/hooks/useSynchronization';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { SimpleTooltip } from '@/components/ui/tooltip';
import { observable } from '@legendapp/state';
import { RefreshCw } from 'lucide-react';
import AppRow from './app-row';

interface SynchronizeTabContentProps {
  onContinue: () => void;
}

export function SynchronizeTabContent({
  onContinue
}: SynchronizeTabContentProps) {
  const {
    // State
    status,
    syncProgress,
    isRescaning,

    // Computed values
    hasAccountsWithErrors: accountsWithErrors,
    filteredAppsWithoutErrors: appsWithoutErrors,
    filteredAppsWithErrors: appsWithErrors,

    // Actions
    rescanFailedAccounts,
    restartSynchronization
  } = useSynchronization();

  const handleMigrate = () => {
    onContinue();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Synchronize Accounts</h2>
          <p className="text-gray-600">
            Click synchronize to start scanning your accounts.
          </p>
        </div>
        <div className="flex gap-2">
          {status !== 'loading' && appsWithoutErrors.length === 0 && (
            <SimpleTooltip tooltipText="Synchronize Again">
              <Button
                onClick={restartSynchronization}
                variant="outline"
                className="flex items-center gap-1"
                disabled={isRescaning}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </SimpleTooltip>
          )}
          <Button
            onClick={handleMigrate}
            disabled={status === 'loading' || appsWithoutErrors.length === 0}
            variant="purple"
          >
            {status === 'loading' ? 'Synchronizing...' : 'Migrate All'}
          </Button>
        </div>
      </div>

      {status === 'loading' && (
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
            <TableHead className="w-[50px]"></TableHead>
            <TableHead className="hidden w-[50px] sm:table-cell"></TableHead>
            <TableHead className="w-[25%]">Name</TableHead>
            <TableHead className="w-[25%]">Addresses</TableHead>
            <TableHead className="w-[25%]">Total Balance</TableHead>
            <TableHead className="w-[100px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(status === 'synchronized' || status === 'loading') &&
          appsWithoutErrors.length ? (
            appsWithoutErrors.map((app) => (
              <AppRow key={app.id.toString()} app={observable(app)} />
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={6}
                className="text-center text-muted-foreground p-4"
              >
                {status === 'synchronized'
                  ? 'No accounts to migrate'
                  : 'No synchronized accounts'}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {accountsWithErrors && (
        <>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold">Failed Synchronization</h2>
              <p className="text-gray-600">
                The account couldn't be scanned successfully. Please try again
                or continue with the successfully scanned accounts.
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
                <TableHead className="w-[25%]"></TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Filter and show only apps with error accounts */}
              {appsWithErrors.map((app) => (
                <AppRow
                  key={app.id.toString()}
                  app={observable(app)}
                  failedSync
                />
              ))}
            </TableBody>
          </Table>
        </>
      )}
    </div>
  );
}
