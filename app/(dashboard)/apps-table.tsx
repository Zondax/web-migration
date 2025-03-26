'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { observable } from '@legendapp/state';
import { observer, use$, useObservable } from '@legendapp/state/react';
import { App, ledgerState$ } from 'app/state/ledger';
import { Address } from 'app/state/types/ledger';
import { useCallback, useState } from 'react';
import AppRow from './app-row';

interface AppsTableProps {
  mode?: 'synchronize' | 'migrate';
}

// Helper function to filter apps without errors
const filterAppsWithoutErrors = (apps: App[]): App[] => {
  return apps
    .map((app) => ({
      ...app,
      accounts:
        app.accounts?.filter(
          (account: Address) =>
            !account.error || account.error?.source === 'migration'
        ) || []
    }))
    .filter((app) => app.accounts.length > 0);
};

// Helper function to filter apps with errors
const filterAppsWithErrors = (apps: App[]): App[] => {
  return apps
    .map((app) => ({
      ...app,
      accounts:
        app.accounts?.filter(
          (account: Address) =>
            account.error && account.error?.source !== 'migration'
        ) || []
    }))
    .filter((app) => app.accounts.length > 0 || app.status === 'error');
};

function AppsTable({ mode = 'migrate' }: AppsTableProps) {
  const apps$ = ledgerState$.apps.apps;
  const status = use$(ledgerState$.apps.status);
  const [isRescaning, setIsRescaning] = useState<boolean>(false);
  const isLedgerConnected$ = useObservable(() =>
    Boolean(
      ledgerState$.device.connection?.transport &&
        ledgerState$.device.connection?.genericApp
    )
  );

  const handleMigrateAll = useCallback(() => {
    ledgerState$.migrateAll();
  }, []);

  const handleSynchronize = useCallback(() => {
    ledgerState$.synchronizeAccounts();
  }, []);

  // Compute if there are any accounts with errors
  const hasAccountsWithErrors = use$(() => {
    return apps$
      .get()
      .some((app) =>
        app.accounts?.some(
          (account) => account.error && account.error?.source !== 'migration'
        )
      );
  });

  // Inside your component:
  const filteredAppsWithoutErrors$ = use$(() =>
    filterAppsWithoutErrors(apps$.get())
  );

  const filteredAppsWithErrors$ = use$(() => filterAppsWithErrors(apps$.get()));

  const rescan = async () => {
    for (const app of filteredAppsWithErrors$) {
      if (app.status === 'error') {
        await ledgerState$.synchronizeAccount(app.id);
      } else if (app.accounts) {
        for (const account of app.accounts) {
          if (account.error) {
            await ledgerState$.getAccountBalance(app.id, account);
          }
        }
      }
    }
  };

  const handleRescan = async () => {
    setIsRescaning(true);
    await rescan();
    setIsRescaning(false);
  };

  const renderActionButton = () => {
    if (mode === 'synchronize') {
      return (
        <Button
          variant="default"
          size="sm"
          onClick={handleSynchronize}
          disabled={!isLedgerConnected$.get() || status === 'loading'}
        >
          {status === 'loading'
            ? 'Synchronizing...'
            : 'Synchronize All Accounts'}
        </Button>
      );
    }

    return status === 'synchronized' ? (
      <Button variant="default" size="sm" onClick={handleMigrateAll}>
        Migrate All
      </Button>
    ) : null;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="space-y-1.5">
              <CardTitle>
                {mode === 'synchronize'
                  ? 'Synchronize Accounts'
                  : 'Synchronized Accounts'}
              </CardTitle>
              <CardDescription>
                {mode === 'synchronize'
                  ? 'Click synchronize to start scanning your accounts.'
                  : 'Please select migrate to migrate all the accounts.'}
              </CardDescription>
            </div>
            <CardAction>{renderActionButton()}</CardAction>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"> </TableHead>
                <TableHead className="hidden w-[100px] sm:table-cell">
                  <span className="sr-only">Image</span>
                </TableHead>
                <TableHead className="w-[25%]">Name</TableHead>
                <TableHead className="w-[25%]">Addresses</TableHead>
                <TableHead className="w-[25%]">Total Balance</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(status === 'synchronized' || status === 'loading') &&
              filteredAppsWithoutErrors$.length ? (
                filteredAppsWithoutErrors$.map((app) => (
                  <AppRow key={app.id} app={observable(app)} />
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
        </CardContent>
      </Card>

      {/* Error accounts card - unchanged */}
      {hasAccountsWithErrors && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="space-y-1.5">
                <CardTitle>Failed Synchronization</CardTitle>
                <CardDescription>
                  The account couldn't be scanned successfully. Please try again
                  or continue with the successfully scanned accounts.
                </CardDescription>
              </div>

              <CardAction>
                {status && ['synchronized', 'rescaning'].includes(status) ? (
                  <Button variant="default" size="sm" onClick={handleRescan}>
                    {isRescaning ? 'Loading...' : 'Rescan'}
                  </Button>
                ) : null}
              </CardAction>
            </div>
          </CardHeader>
          <CardContent>
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
                {filteredAppsWithErrors$.map((app) => (
                  <AppRow
                    key={app.id.toString()}
                    app={observable(app)}
                    failedSync
                  />
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default observer(AppsTable);
