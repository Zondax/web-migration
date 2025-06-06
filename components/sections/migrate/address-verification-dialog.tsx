'use client'

import { useEffect } from 'react'
import { uiState$ } from '@/state/ui'
import { use$ } from '@legendapp/state/react'
import { AlertCircle, CheckCircle, Clock } from 'lucide-react'

import { AppId, appsConfigs } from '@/config/apps'
import { muifyHtml } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AddressLink } from '@/components/AddressLink'
import { useMigration, VerificationStatus } from '@/components/hooks/useMigration'
import { Spinner } from '@/components/icons'

interface AddressVerificationDialogProps {
  open: boolean
  onClose: () => void
}

export function AddressVerificationDialog({ open, onClose }: AddressVerificationDialogProps) {
  const icons = use$(uiState$.icons.get())

  // Use the hook directly instead of receiving via props
  const { destinationAddressesByApp, verifyDestinationAddresses, verifyFailedAddresses, isVerifying, allVerified, anyFailed } =
    useMigration()

  const startVerification = async () => {
    // If there are failed addresses, only verify those, otherwise verify all
    if (anyFailed) {
      verifyFailedAddresses()
    } else {
      verifyDestinationAddresses()
    }
  }

  useEffect(() => {
    if (allVerified && !isVerifying) {
      const timer = setTimeout(() => {
        onClose()
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [allVerified, isVerifying, onClose])

  const renderStatusIcon = (status: VerificationStatus) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-muted-foreground" />
      case 'verifying':
        return <Spinner />
      case 'verified':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Verify Destination Addresses</DialogTitle>
          <DialogDescription className="pt-4 !mt-0">
            Please verify all destination addresses. You will need to confirm each address on your Ledger device.
          </DialogDescription>
        </DialogHeader>
        <div className="border rounded-lg overflow-hidden bg-gray-50">
          <div className="p-4">
            <h4 className="font-medium mb-2">Destination Addresses</h4>
            <ul className="space-y-2 max-h-[250px] overflow-auto">
              {Object.entries(destinationAddressesByApp).map(([appId, addresses], index) => {
                const appConfig = appsConfigs.get(appId as AppId)
                const appName = appConfig?.name || appId
                const icon = icons[appId as AppId]

                return (
                  <li key={index} className={`flex flex-col p-2 rounded border bg-white`}>
                    <div className="font-medium text-sm mb-2 flex items-center gap-2">
                      {icon && (
                        <div className="max-h-5 overflow-hidden [&_svg]:max-h-5 [&_svg]:w-5 flex items-center">{muifyHtml(icon)}</div>
                      )}
                      <span>{appName}</span>
                    </div>
                    <div className="flex flex-col">
                      {addresses.map((item, index) => (
                        <div key={index} className="flex flex-row items-center justify-between">
                          <div className="text-xs font-mono text-gray-500">
                            <AddressLink value={item.address} disableTooltip />
                          </div>
                          <div className="flex items-center">{renderStatusIcon(item.status)}</div>
                        </div>
                      ))}
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
        <div className="flex justify-center gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button className="bg-[#7916F3] hover:bg-[#6B46C1] text-white" onClick={startVerification} disabled={isVerifying || allVerified}>
            {isVerifying ? 'Verifying...' : allVerified ? 'All Verified' : anyFailed ? 'Retry Failed' : 'Verify Addresses'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
