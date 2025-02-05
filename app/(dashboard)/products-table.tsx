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
import { observer, use$ } from '@legendapp/state/react';
import { uiState$ } from 'app/state/ui';
import { useCallback, useState } from 'react';
import Product from './product';

function ProductsTable() {
  const apps$ = uiState$.apps.apps;
  const status = use$(uiState$.apps.status);
  const [isRescaning, setIsRescaning] = useState<boolean>(false);

  const handleMigrateAll = useCallback(() => {
    uiState$.migrateAll();
  }, []);

  // Compute if there are any accounts with errors
  const hasAccountsWithErrors = use$(() => {
    return apps$
      .get()
      .some((app) => app.accounts?.some((account) => account.error));
  });

  // Create observables for apps with and without error accounts
  const appsWithoutErrorAccounts$ = use$(() =>
    apps$
      .get()
      .map((app) => ({
        ...app,
        accounts: app.accounts?.filter((account) => !account.error) || []
      }))
      .filter((app) => app.accounts.length > 0)
  );

  const appsWithErrorAccounts$ = use$(() =>
    apps$
      .get()
      .map((app) => ({
        ...app,
        accounts: app.accounts?.filter((account) => account.error) || []
      }))
      .filter((app) => app.accounts.length > 0 || app.status === 'error')
  );

  const rescan = async () => {
    for (const app of appsWithErrorAccounts$) {
      if (app.status === 'error') {
        await uiState$.synchronizeAccount(app.id);
      } else {
        for (const account of app.accounts) {
          if (account.error) {
            await uiState$.synchronizeBalance(app.id, account.address);
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

  return (
    <div className="space-y-4">
      {/* Add space between the two tables */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="space-y-1.5">
              <CardTitle>Synchronized Accounts</CardTitle>
              <CardDescription>
                Please select migrate to migrate all the accounts.
              </CardDescription>
            </div>
            <CardAction>
              {status === 'synchronized' ? (
                <Button variant="default" size="sm" onClick={handleMigrateAll}>
                  Migrate All
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
                <TableHead>Name</TableHead>
                <TableHead>Addresses</TableHead>
                <TableHead>Total Balance</TableHead>
                <TableHead></TableHead>
                {/* <TableHead className="hidden md:table-cell">Actions</TableHead> */}
              </TableRow>
            </TableHeader>
            <TableBody>
              {appsWithoutErrorAccounts$.length ? (
                appsWithoutErrorAccounts$.map((app) => (
                  <Product key={app.id} app={observable(app)} />
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-muted-foreground"
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
      {/* Only show error table if there are accounts with errors */}
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
                  <TableHead>Name</TableHead>
                  <TableHead>Addresses</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Filter and show only apps with error accounts */}
                {appsWithErrorAccounts$.map((app) => (
                  <Product
                    key={app.id.toString()}
                    app={observable(app)}
                    hideBalance
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

export default observer(ProductsTable);
