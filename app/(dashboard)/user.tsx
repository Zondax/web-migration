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
import { observer } from '@legendapp/state/react';
import { uiState$ } from 'app/state/ui';
import Image from 'next/image';
import { useCallback } from 'react';

function User() {
  const user = { image: null }; // Placeholder for user object

  const isLedgerConnected = uiState$.device.isConnected.get();

  const connectDevice = useCallback(() => {
    uiState$.connectLedger();
  }, []);

  const disconnectDevice = useCallback(() => {
    uiState$.disconnectLedger();
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
          onClick={isLedgerConnected ? disconnectDevice : connectDevice}
        >
          {isLedgerConnected ? 'Disconnect wallet' : 'Connect your wallet'}
        </DropdownMenuItem>
        <DropdownMenuItem disabled>Settings</DropdownMenuItem>
        <DropdownMenuItem disabled>Support</DropdownMenuItem>
        <DropdownMenuSeparator />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default observer(User);
