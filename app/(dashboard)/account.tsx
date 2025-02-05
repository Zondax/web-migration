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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { Observable } from '@legendapp/state';
import { observer } from '@legendapp/state/react';
import { Address, uiState$ } from 'app/state/ui';
import { AlertCircle } from 'lucide-react';
import { useCallback } from 'react';

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

function accounts({
  accounts,
  appId
}: {
  accounts: Observable<Address[] | undefined>;
  appId: string;
}) {
  return (
    <TableRow>
      <TableCell colSpan={6} className="p-0">
        <div className="bg-muted/50">
          <Table className="w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="text-left py-2">Address</TableHead>
                <TableHead className="text-left py-2">Public Key</TableHead>
                <TableHead className="text-right py-2">Balance</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.length > 0 ? (
                accounts.map((account, index) => (
                  <TableRow key={account.address.get() || index}>
                    <TableCell className="py-2 text-sm w-1/3">
                      <AddressLink
                        value={account.address.get()}
                        tooltipText={account.address.get()}
                        className="break-all"
                      />
                    </TableCell>
                    <TableCell className="py-2 text-sm w-1/3">
                      <AddressLink
                        value={account.pubKey.get()}
                        tooltipText={account.pubKey.get()}
                        className="break-all"
                      />
                    </TableCell>
                    <TableCell className="py-2 text-sm text-right w-1/3">
                      {account.balance.get() !== undefined
                        ? account.balance.get()
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2 justify-end items-center">
                        {/* <AccountActionButton
                          account={account}
                          index={index}
                          appId={appId}
                        /> */}
                        {account.error.get() && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <AlertCircle className="h-4 w-4 text-destructive cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{account.error.get()?.description}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
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
  );
}

export default observer(accounts);
