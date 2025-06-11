import { AddressLink } from '@/components/AddressLink'
import { useMigration } from '@/components/hooks/useMigration'
import { TransactionStatusBody } from '@/components/sections/migrate/transaction-dialog'
import { Button } from '@/components/ui/button'
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { AppId } from '@/config/apps'
import { muifyHtml } from '@/lib/utils/html'
import { uiState$ } from '@/state/ui'
import { use$ } from '@legendapp/state/react'
import { observer } from '@legendapp/state/react'

interface MigrationProgressDialogProps {
  open: boolean
  onClose: () => void
}

export const MigrationProgressDialog = observer(function MigrationProgressDialog({ open, onClose }: MigrationProgressDialogProps) {
  const { migratingItem } = useMigration()
  const icons = use$(uiState$.icons.get())

  // Only show dialog if there is a migrating item, regardless of the open prop
  const shouldShowDialog = open && !!migratingItem

  return (
    <Dialog open={shouldShowDialog} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transaction Approval Needed</DialogTitle>
          {migratingItem && (
            <DialogDescription className="flex items-center gap-2">
              {migratingItem.appId && icons[migratingItem.appId as AppId] && (
                <div className="max-h-5 overflow-hidden [&_svg]:max-h-5 [&_svg]:w-5 flex items-center">
                  {muifyHtml(icons[migratingItem.appId as AppId])}
                </div>
              )}
              <span>{migratingItem.appName}</span>
              <span className="text-xs font-mono text-gray-500">
                <AddressLink value={migratingItem.account.address} disableTooltip />
              </span>
            </DialogDescription>
          )}
        </DialogHeader>
        <DialogBody>
          {migratingItem && (
            <TransactionStatusBody
              status={migratingItem.status}
              statusMessage={migratingItem.statusMessage}
              hash={migratingItem.hash}
              blockHash={migratingItem.blockHash}
              blockNumber={migratingItem.blockNumber}
            />
          )}
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Dismiss
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
})
