import { AddressLink } from '@/components/AddressLink';
import { Spinner } from '@/components/icons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
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
import { formatBalance } from '@/lib/utils';
import { Observable } from '@legendapp/state';
import { observer } from '@legendapp/state/react';
import { ledgerState$ } from 'app/state/ledger';
import { Address } from 'app/state/types/ledger';
import {
  AlertCircle,
  CheckCircle,
  ChevronDown,
  Clock,
  XCircle
} from 'lucide-react';
import DestinationAddressSelect from './destination-address-select';

function AccountsTable({
  accounts,
  ticker,
  decimals
}: {
  accounts: Observable<Address[] | undefined>;
  ticker: string;
  decimals: number;
}) {
  // Get Polkadot addresses for the destination selector
  const polkadotAddresses = ledgerState$.apps.polkadotApp.accounts?.get();

  const handleDestinationChange = (value: string, accountIndex: number) => {
    accounts[accountIndex].destinationAddress.set(value);
  };

  const renderStatusIcon = (account: Observable<Address>) => {
    const txStatus = account.transaction.get()?.status;
    const txStatusMessage = account.transaction.get()?.statusMessage;
    let statusIcon;
    let tooltipContent = txStatusMessage || 'Checking status...';

    if (account.isLoading.get()) {
      statusIcon = <Spinner />;
      tooltipContent = 'Loading...';
    } else {
      switch (txStatus) {
        case 'pending':
          statusIcon = <Clock className="h-4 w-4 text-muted-foreground" />;
          tooltipContent = 'Transaction pending...';
          break;
        case 'inBlock':
          statusIcon = <Clock className="h-4 w-4 text-muted-foreground" />;
          break;
        case 'finalized':
          statusIcon = <Clock className="h-4 w-4 text-muted-foreground" />;
          break;
        case 'success':
          statusIcon = <CheckCircle className="h-4 w-4 text-green-500" />;
          break;
        case 'failed':
          statusIcon = <XCircle className="h-4 w-4 text-red-500" />;
          break;
        case 'error':
          statusIcon = <AlertCircle className="h-4 w-4 text-red-500" />;
          break;
        case 'warning':
          statusIcon = <AlertCircle className="h-4 w-4 text-yellow-500" />;
          break;
        case 'completed':
          statusIcon = <Clock className="h-4 w-4 text-muted-foreground" />;
          break;
        default:
          statusIcon = null;
      }
    }

    return statusIcon ? (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{statusIcon}</TooltipTrigger>
          <TooltipContent>
            <p>{tooltipContent}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    ) : null;
  };

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
                <TableHead className="text-left py-2">
                  Destination Address
                </TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.length > 0 ? (
                accounts.map((account, index) => (
                  <TableRow key={account.address.get() || index}>
                    <TableCell className="py-2 text-sm w-1/4">
                      <AddressLink
                        value={account.address.get()}
                        tooltipText={account.address.get()}
                        className="break-all"
                      />
                    </TableCell>
                    <TableCell className="py-2 text-sm w-1/4">
                      <AddressLink
                        value={account.pubKey.get()}
                        tooltipText={account.pubKey.get()}
                        className="break-all"
                      />
                    </TableCell>
                    <TableCell className="py-2 text-sm text-right w-1/4">
                      {account.balance.get() !== undefined
                        ? formatBalance(
                            account.balance.get()!,
                            ticker,
                            decimals
                          )
                        : '-'}
                    </TableCell>
                    <TableCell className="py-2 text-sm w-1/4">
                      <DestinationAddressSelect
                        account={account}
                        index={index}
                        polkadotAddresses={polkadotAddresses}
                        onDestinationChange={handleDestinationChange}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2 justify-end items-center">
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
                        {renderStatusIcon(account)}

                        {account.transaction.get()?.hash && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <ChevronDown className="h-4 w-4 text-muted-foreground cursor-pointer" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="min-w-[300px]">
                              {/* Transaction Details */}
                              {account.transaction.get()?.hash && (
                                <DropdownMenuItem className="gap-2">
                                  Transaction Hash:
                                  <AddressLink
                                    value={
                                      account.transaction.get()?.hash ?? ''
                                    }
                                    tooltipText={
                                      account.transaction.get()?.hash
                                    }
                                    className="break-all"
                                  />
                                </DropdownMenuItem>
                              )}
                              {account.transaction.get()?.blockHash && (
                                <DropdownMenuItem className="gap-2">
                                  Block Hash:
                                  <AddressLink
                                    value={
                                      account.transaction.get()?.blockHash ?? ''
                                    }
                                    tooltipText={
                                      account.transaction.get()?.blockHash
                                    }
                                    className="break-all"
                                  />
                                </DropdownMenuItem>
                              )}
                              {account.transaction.get()?.blockNumber && (
                                <DropdownMenuItem className="gap-2">
                                  Block Number:
                                  <AddressLink
                                    value={
                                      account.transaction.get()?.blockNumber ??
                                      ''
                                    }
                                    tooltipText={
                                      account.transaction.get()?.blockNumber
                                    }
                                    className="break-all"
                                  />
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={5}
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

export default observer(AccountsTable);
