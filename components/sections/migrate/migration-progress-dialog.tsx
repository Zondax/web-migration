import { AddressLink } from '@/components/AddressLink'
import TokenIcon from '@/components/TokenIcon'
import { useTokenLogo } from '@/components/hooks/useTokenLogo'
import { TransactionStatusBody } from '@/components/sections/migrate/transaction-dialog'
import { Button } from '@/components/ui/button'
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { AppId } from '@/config/apps'
import { muifyHtml } from '@/lib/utils/html'
import { observer } from '@legendapp/state/react'

interface MigrationProgressDialogProps {
  open: boolean
  onClose: () => void
  migratingItem?: any // TODO: Replace 'any' with the correct type if available
}

export const MigrationProgressDialog = observer(function MigrationProgressDialog({
  open,
  onClose,
  migratingItem,
}: MigrationProgressDialogProps) {
  const icon = useTokenLogo(migratingItem?.appId)

  // Only show dialog if there is a migrating item, regardless of the open prop
  const shouldShowDialog = open && !!migratingItem

  return (
    <Dialog open={shouldShowDialog} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transaction Approval Needed</DialogTitle>
          {migratingItem && (
            <DialogDescription className="flex items-center gap-2">
              <TokenIcon icon={icon} symbol={migratingItem.appName} size="sm" />
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
