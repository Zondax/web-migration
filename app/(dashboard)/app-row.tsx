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
import { observer } from '@legendapp/state/react';
import { App, uiState$ } from 'app/state/ui';
import { AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useCallback, useState } from 'react';
import Accounts from './accounts-table';

function AppRow({
  app,
  hideBalance
}: {
  app: Observable<App>;
  hideBalance?: boolean;
}) {
  const name = app.name.get();
  const id = app.id.get();
  const status = app.status.get();

  const [isExpanded, setIsExpanded] = useState(false);

  const isSynchronizationLoading = uiState$.apps.status.get();
  const icon = uiState$.apps.icons.get()[id];

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const renderAction = useCallback(() => {
    if (hideBalance || !status) {
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
    if (hideBalance) return null;
    const balance = app.accounts
      .get()
      ?.reduce((total, account) => total + (account.balance || 0), 0);

    return balance !== undefined
      ? formatBalance(balance, app.ticker.get())
      : '-';
  };

  return (
    <>
      <TableRow>
        <TableCell>
          {app.accounts.get()?.length !== 0 && (
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
          {app.accounts.get()?.length ?? '-'}
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
        <Accounts accounts={app.accounts} ticker={app.ticker.get()} />
      ) : null}
    </>
  );
}

export default observer(AppRow);
