'use client';

import { Button } from '@/components/ui/button';
import { observer } from '@legendapp/state/react';
import { uiState$ } from 'app/state/ui';
import { useCallback } from 'react';
import { Badge } from './ui/badge';

function SynchronizeButton() {
  const isLedgerConnected = uiState$.device.isConnected.get();

  const synchronizeAccounts = useCallback(() => {
    uiState$.synchronizeAccounts();
  }, []);

  const status = uiState$.apps.status.get();

  if (status === 'synchronized') {
    return (
      <Badge variant="outline" className="capitalize">
        Synchronized Accounts
      </Badge>
    );
  }
  return (
    <Button
      aria-haspopup="true"
      variant="default"
      size="sm"
      disabled={!isLedgerConnected}
      onClick={synchronizeAccounts}
    >
      {uiState$.apps.status.get() === 'loading'
        ? 'Loading...'
        : 'Synchronize All Accounts'}
    </Button>
  );
}
export default observer(SynchronizeButton);
