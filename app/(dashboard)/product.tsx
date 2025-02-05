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
import { Observable } from '@legendapp/state';
import { observer } from '@legendapp/state/react';
import { Address, App, uiState$ } from 'app/state/ui';
import { AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useCallback, useState } from 'react';
import Accounts from './account';

interface AccountActionButtonProps {
  account: Observable<Address>;
  index: number;
  appId: string;
}

const AccountActionButton: React.FC<AccountActionButtonProps> = ({
  account,
  index,
  appId
}) => {
  const balance = account.balance.get();
  const status = account.status.get();
  const isLoading = account.isLoading.get();

  const migrateAccount = useCallback(
    (accountIndex: number) => {
      uiState$.migrateAccount(appId, accountIndex);
    },
    [appId]
  );

  if (status === 'migrated') {
    return (
      <Badge variant="outline" className="capitalize">
        Migrated
      </Badge>
    );
  }
  return (
    <Button
      aria-haspopup="true"
      variant="default"
      size="sm"
      disabled={!(balance && balance > 0) || isLoading}
      onClick={() => migrateAccount(index)}
    >
      {isLoading ? 'Loading...' : 'Migrate'}
    </Button>
  );
};

function app({
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

  const isLedgerConnected = uiState$.device.isConnected.get();
  const isSynchronizationLoading = uiState$.apps.status.get();
  const icon = uiState$.apps.icons.get()[id];

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const renderAction = useCallback(() => {
    if (status && ['loading', 'migrated'].includes(status)) {
      return (
        <Badge variant="destructive" className="capitalize">
          {status}
        </Badge>
      );
    }

    return null;
  }, [status, isSynchronizationLoading]);

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
        <TableCell className="hidden sm:table-cell [&_svg]:h-8 [&_svg]:w-8">
          {muifyHtml(icon)}
        </TableCell>
        <TableCell className="font-medium">{name}</TableCell>
        <TableCell className="font-medium">
          {app.accounts.get()?.length ?? '-'}
        </TableCell>
        {!hideBalance && (
          <TableCell className="font-medium">
            {app.accounts.get()
              ? app.accounts
                  .get()
                  ?.reduce(
                    (total, account) => total + (account.balance || 0),
                    0
                  )
              : '-'}
          </TableCell>
        )}
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
      {isExpanded ? <Accounts appId={id} accounts={app.accounts} /> : null}
    </>
  );
}

export default observer(app);
