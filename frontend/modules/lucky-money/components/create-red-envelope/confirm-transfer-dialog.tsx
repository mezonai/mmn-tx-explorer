'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { NumberUtil } from '@/utils';
import { Info } from 'lucide-react';

interface ConfirmTransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  amount: number | string;
  isCreate: boolean;
}

export function RedEnvelopeConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  amount,
  isCreate,
}: ConfirmTransferDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-brand-primary pb-2 text-left text-lg font-semibold">
            {isCreate ? 'Confirm Transfer' : 'Confirm Close & Refund'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/50">
          <Info className="text-brand-primary mt-0.5 h-5 w-5 shrink-0" />
          {isCreate ? (
            <p className="text-muted-foreground text-sm leading-relaxed">
              To let the system help you send lucky money to everyone, you’ll need to transfer{' '}
              <span className="text-brand-primary font-bold">
                {amount ? NumberUtil.formatWithCommas(amount) : '0'} đồng
              </span>{' '}
              to the system’s wallet. Please click the{' '}
              <span className="text-brand-primary font-bold">Confirm & Transfer</span> button to confirm and agree to
              make the transfer.
            </p>
          ) : (
            <p className="text-muted-foreground text-sm leading-relaxed">
              Are you sure you want to close this session? The remaining balance of{' '}
              <span className="text-brand-primary font-bold">
                {amount ? NumberUtil.formatWithCommas(amount) : '0'} đồng
              </span>{' '}
              will be returned to your wallet immediately.
            </p>
          )}
        </div>

        <div className="mt-4 flex flex-col space-y-4">
          <Button
            onClick={onConfirm}
            className="bg-brand-primary shadow-primary/30 hover:bg-primary-light mt-2 w-full rounded-xl py-3 text-sm font-semibold text-white shadow-lg transition"
          >
            {isCreate ? 'Confirm & Transfer' : 'Confirm & Refund'}
          </Button>

          <button
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground hover:text-foreground w-full text-center text-xs transition"
          >
            Cancel
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
