'use client'

import { useCallback } from 'react'

import { useConnection } from '@/components/hooks/useConnection'
import { Button } from '@/components/ui/button'

interface ConnectTabContentProps {
  onContinue: () => void
}

export function ConnectTabContent({ onContinue }: ConnectTabContentProps) {
  const { isLedgerConnected, isAppOpen, connectDevice } = useConnection()

  const handleConnect = useCallback(async () => {
    const connected = await connectDevice()
    if (connected) {
      onContinue()
    }
  }, [connectDevice, onContinue])

  return (
    <div className="flex flex-col items-center justify-center h-full py-12 w-full">
      <h2 className="text-2xl font-bold mb-8">Connect Your Ledger Device</h2>
      <div className="max-w-md text-center">
        <p className="mb-6">To begin the migration process, please follow these steps:</p>
        <ol className="text-center space-y-3">
          <li className="flex items-center justify-center">
            <span className={`mr-3 font-medium ${isLedgerConnected ? 'text-purple-400' : ''}`}>1.</span>
            <span className={isLedgerConnected ? 'text-purple-400' : ''}>Connect your Ledger device to your computer</span>
          </li>
          <li className="flex items-center justify-center">
            <span className={`mr-3 font-medium ${isLedgerConnected ? 'text-purple-400' : ''}`}>2.</span>
            <span className={isLedgerConnected ? 'text-purple-400' : ''}>Enter your PIN code on the device</span>
          </li>
          <li className="flex items-center justify-center">
            <span className={`mr-3 font-medium ${isLedgerConnected && !isAppOpen ? 'text-rose-400' : isAppOpen ? 'text-purple-400' : ''}`}>
              3.
            </span>
            <span className={isLedgerConnected && !isAppOpen ? 'text-rose-400' : isAppOpen ? 'text-purple-400' : ''}>
              Open the Migration App on your Ledger
            </span>
          </li>
          <li className="flex items-center justify-center">
            <span className="mr-3 font-medium">4.</span>
            <span>Click the Connect button below</span>
          </li>
        </ol>
      </div>
      <Button className="mt-10 bg-gray-900 hover:bg-gray-800 text-white px-6 py-2 rounded-md" onClick={handleConnect}>
        Connect Ledger
      </Button>
    </div>
  )
}
