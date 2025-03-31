import { Spinner } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { muifyHtml } from '@/lib/muifyHtml';
import { formatBalance } from '@/lib/utils';
import { Observable } from '@legendapp/state';
import { observer, use$ } from '@legendapp/state/react';
import { AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { App, ledgerState$ } from 'state/ledger';
import { uiState$ } from 'state/ui';
import Accounts from './accounts-table';

function AppRow({
  app,
  failedSync
}: {
  app: Observable<App>;
  failedSync?: boolean;
}) {
  const name = use$(app.name);
  const id = use$(app.id);
  const status = use$(app.status);
  const accounts = use$(app.accounts);

  const [isExpanded, setIsExpanded] = useState(false);

  const isSynchronizationLoading = ledgerState$.apps.status.get();
  const icon = uiState$.icons.get()[id];

  const polkadotAddresses = useMemo(
    () => ledgerState$.polkadotAddresses[id].get(),
    [id]
  );

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const renderAction = useCallback(() => {
    if (failedSync || !status) {
      return null;
    }
    if (status === 'loading') {
      return <Spinner />;
    }

    if (status === 'migrated') {
      return (
        <Badge variant="destructive" className="capitalize">
          {status}
        </Badge>
      );
    }

    return null;
  }, [status, isSynchronizationLoading]);

  const renderBalance = () => {
    if (failedSync) return null;
    const balance = accounts?.reduce(
      (total, account) => total + (account.balance || 0),
      0
    );

    return balance !== undefined
      ? formatBalance(balance, app.ticker.get(), app.decimals.get())
      : '-';
  };

  return (
    <>
      <TableRow>
        <TableCell>
          {accounts?.length !== 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleExpand}
              className="p-0 h-8 w-8"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          )}
        </TableCell>
        <TableCell className="hidden sm:table-cell">
          <div className="max-h-8 overflow-hidden [&_svg]:max-h-8 [&_svg]:w-8">
            {muifyHtml(icon)}
          </div>
        </TableCell>
        <TableCell className="font-medium">{name}</TableCell>
        <TableCell className="font-medium">
          {accounts && accounts.length !== 0 ? accounts.length : '-'}
        </TableCell>
        <TableCell className="font-medium">{renderBalance()}</TableCell>
        <TableCell>
          <div className="flex gap-2 justify-end items-center">
            {renderAction()}
            {app.error?.description?.get() && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AlertCircle className="h-4 w-4 text-destructive cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{app.error?.description?.get()}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </TableCell>
      </TableRow>
      {isExpanded ? (
        <Accounts
          accounts={app.accounts}
          ticker={app.ticker.get()}
          decimals={app.decimals.get()}
          polkadotAddresses={polkadotAddresses ?? []}
        />
      ) : null}
    </>
  );
}

export default observer(AppRow);
