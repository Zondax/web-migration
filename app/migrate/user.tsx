'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { observer, useObservable } from '@legendapp/state/react';
import Image from 'next/image';
import { useCallback } from 'react';
import { ledgerState$ } from 'state/ledger';

function User() {
  const user = { image: null }; // Placeholder for user object

  const isLedgerConnected$ = useObservable(() =>
    Boolean(
      ledgerState$.device.connection?.transport &&
        ledgerState$.device.connection?.genericApp
    )
  );

  const connectDevice = useCallback(() => {
    ledgerState$.connectLedger();
  }, []);

  const disconnectDevice = useCallback(() => {
    ledgerState$.disconnectLedger();
  }, []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="overflow-hidden rounded-full"
        >
          <Image
            src={user?.image ?? '/placeholder-user.jpg'}
            width={36}
            height={36}
            alt="Avatar"
            className="overflow-hidden rounded-full"
          />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={isLedgerConnected$.get() ? disconnectDevice : connectDevice}
        >
          {isLedgerConnected$.get()
            ? 'Disconnect wallet'
            : 'Connect your wallet'}
        </DropdownMenuItem>
        <DropdownMenuItem disabled>Settings</DropdownMenuItem>
        <DropdownMenuItem disabled>Support</DropdownMenuItem>
        <DropdownMenuSeparator />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default observer(User);
