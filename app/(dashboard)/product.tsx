import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { muifyHtml } from '@/lib/muifyHtml';
import { Observable } from '@legendapp/state';
import { observer } from '@legendapp/state/react';
import { Address, App, uiState$ } from 'app/state/ui';
import { ChevronDown, ChevronUp } from 'lucide-react';
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

function app({ app }: { app: Observable<App> }) {
  const name = app.name.get();
  const id = app.id.get();
  const status = app.status.get();

  const [isExpanded, setIsExpanded] = useState(true);

  const isLedgerConnected = uiState$.device.isConnected.get();

  const icon = uiState$.apps.icons.get()[id];

  const synchronizeAccount = useCallback(() => {
    uiState$.synchronizeAccount(id);
  }, [name]);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const renderAction = useCallback(() => {
    if (status === 'loading') {
      return (
        <Badge variant="destructive" className="capitalize">
          Loading
        </Badge>
      );
    }
    if (status === 'error') {
      return (
        <Button
          aria-haspopup="true"
          variant="default"
          size="sm"
          disabled={!isLedgerConnected}
          onClick={synchronizeAccount}
        >
          Synchronize
        </Button>
      );
    }
    return null;
  }, [status, isLedgerConnected]);

  return (
    <>
      <TableRow>
        <TableCell>
          {app.accounts.get() && (
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
          {muifyHtml(icon)}
        </TableCell>
        <TableCell className="font-medium">{name}</TableCell>
        <TableCell>{renderAction()}</TableCell>
      </TableRow>
      {isExpanded ? <Accounts appId={id} accounts={app.accounts} /> : null}
    </>
  );
}

export default observer(app);
