'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { observer } from '@legendapp/state/react';
import { ledgerState$ } from 'app/state/ledger';
import { useCallback } from 'react';

function ConnectTab() {
  const handleConnect = useCallback(async () => {
    await ledgerState$.connectLedger();
    ledgerState$.synchronizeAccounts();
  }, []);

  return (
    <div className="">
      <Card className="flex flex-col w-full min-h-[80vh] items-center justify-center">
        <CardHeader>
          <CardTitle className="text-center">
            Connect Your Ledger Device
          </CardTitle>
          <CardDescription className="w-fit self-center text-center pt-5">
            To begin the migration process, please follow these steps:
            <ol className="mt-2 list-decimal list-inside space-y-1">
              <li>Connect your Ledger device to your computer</li>
              <li>Enter your PIN code on the device</li>
              <li>Open the Migration App on your Ledger</li>
              <li>Click the Connect button below</li>
            </ol>
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button onClick={handleConnect}>
            {ledgerState$.device.isLoading.get()
              ? 'Connecting...'
              : 'Connect Ledger'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default observer(ConnectTab);
