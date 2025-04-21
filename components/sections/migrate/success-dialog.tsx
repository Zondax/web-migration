'use client'

import { CheckCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface SuccessDialogProps {
  open: boolean
  onClose: () => void
  onReturn: () => void
  successCount: number
  totalCount: number
}

export function SuccessDialog({ open, onClose, onReturn, successCount, totalCount }: SuccessDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md text-center">
        <DialogHeader className="items-center">
          <DialogTitle className="flex items-center justify-center gap-2 text-xl">
            <CheckCircle className="h-6 w-6 text-green-500" />
            Migration Completed
          </DialogTitle>
          <DialogDescription className="text-center pt-4 !mt-0">
            Your accounts have been migrated to the Universal Ledger App.
          </DialogDescription>
          <DialogDescription className="text-center pt-3 !mt-0">
            {successCount} of {totalCount} transactions successful.
          </DialogDescription>
          <DialogDescription className="text-center pt-3 !mt-0">View details to see the results of the transactions.</DialogDescription>
        </DialogHeader>
        <div className="flex justify-center gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            View Details
          </Button>
          <Button className="bg-[#7916F3] hover:bg-[#6B46C1] text-white" onClick={onReturn}>
            Return to Home
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
