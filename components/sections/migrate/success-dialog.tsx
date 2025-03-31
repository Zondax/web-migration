'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { CheckCircle } from 'lucide-react';

interface SuccessDialogProps {
  open: boolean;
  onClose: () => void;
  onReturn: () => void;
  successCount: number;
  totalCount: number;
}

export function SuccessDialog({
  open,
  onClose,
  onReturn,
  successCount,
  totalCount
}: SuccessDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md text-center">
        <DialogHeader className="items-center">
          <DialogTitle className="flex items-center justify-center gap-2 text-xl">
            <CheckCircle className="h-6 w-6 text-green-500" />
            Migration Completed
          </DialogTitle>
          <DialogDescription className="space-y-2 text-center pt-4 !mt-0">
            <p>Your accounts have been migrated to the Universal Ledger App.</p>
            <p>
              {successCount} of {totalCount} transactions completed.
            </p>
            <p>View details to see the results of the transactions.</p>
          </DialogDescription>
        </DialogHeader>
        {/* <div className="border rounded-lg overflow-hidden bg-gray-50">
          <div className="p-4">
            <h4 className="font-medium mb-2 text-center">Migrated Addresses</h4>
            <ul className="space-y-2">
              <li className="flex items-center justify-between p-2 bg-white rounded border">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-gradient-to-br from-[#FF2670] to-[#7916F3] rounded-full flex items-center justify-center text-white text-xs">
                      K
                    </div>
                    <span className="font-medium text-sm">Kusama</span>
                  </div>
                  <div className="mt-1 text-xs font-mono text-gray-500">
                    EvSBhym8...HpaFKacV
                  </div>
                </div>
                <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                  Migrated
                </span>
              </li>
            </ul>
          </div>
        </div> */}
        <div className="flex justify-center gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            View Details
          </Button>
          <Button
            className="bg-[#7916F3] hover:bg-[#6B46C1] text-white"
            onClick={onReturn}
          >
            Return to Home
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
