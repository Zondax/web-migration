import { AddressLink } from '@/components/AddressLink';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { muifyHtml } from '@/lib/muifyHtml';
import { observer } from '@legendapp/state/react';
import { App, uiState$ } from 'app/state/ui';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useCallback, useState } from 'react';

function app({ app }: { app: App }) {
  const [isExpanded, setIsExpanded] = useState(true);

  const isLedgerConnected = uiState$.device.isConnected.get();

  const icon = uiState$.apps.icons.get()[app.id];

  const synchronizeAccount = useCallback(() => {
    uiState$.synchronizeAccount(app.id);
  }, [app.name]);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const renderAction = useCallback(() => {
    if (app.status === 'loading') {
      return (
        <Badge variant="outline" className="capitalize">
          Loading
        </Badge>
      );
    }
    if (app.status === 'error') {
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
  }, [app.status, isLedgerConnected]);

  return (
    <>
      <TableRow>
        <TableCell>
          {app.accounts && (
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
        <TableCell className="font-medium">{app.name}</TableCell>
        <TableCell>{renderAction()}</TableCell>
      </TableRow>
      {isExpanded && app.accounts && (
        <TableRow>
          <TableCell colSpan={4} className="p-0">
            <div className="bg-muted/50 p-4">
              <Table className="w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-left py-2">Address</TableHead>
                    <TableHead className="text-left py-2">Public Key</TableHead>
                    <TableHead className="text-right py-2">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {app.accounts.length > 0 ? (
                    app.accounts.map((account, index) => (
                      <TableRow key={account.address || index}>
                        <TableCell className="py-2 text-sm w-1/3">
                          <AddressLink
                            value={account.address}
                            tooltipText={account.address}
                            className="break-all"
                          />
                        </TableCell>
                        <TableCell className="py-2 text-sm w-1/3">
                          <AddressLink
                            value={account.pubKey}
                            tooltipText={account.pubKey}
                            className="break-all"
                          />
                        </TableCell>
                        <TableCell className="py-2 text-sm text-right w-1/3">
                          {account.balance !== undefined
                            ? account.balance
                            : '-'}
                        </TableCell>
                        <TableCell>
                          <Button
                            aria-haspopup="true"
                            variant="default"
                            size="sm"
                            disabled={!(account.balance && account.balance > 0)}
                            onClick={synchronizeAccount}
                          >
                            Migrate
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center text-muted-foreground"
                      >
                        No accounts to migrate
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

export default observer(app);
