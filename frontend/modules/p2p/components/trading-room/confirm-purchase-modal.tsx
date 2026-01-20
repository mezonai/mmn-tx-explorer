'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Info, Loader2 } from 'lucide-react';
import { APP_CONFIG } from '@/configs/app.config';
import { formatCurrency } from '@/modules/p2p/util';

interface ConfirmPurchaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amountToBuy: number;
  amountToPay: number;
  priceRate: number;
  onConfirm: () => void;
  isLoading?: boolean;
}

export const ConfirmPurchaseModal = ({
  open,
  onOpenChange,
  amountToBuy,
  amountToPay,
  priceRate,
  onConfirm,
  isLoading = false,
}: ConfirmPurchaseModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle className="text-brand-primary pb-2 text-left text-lg font-semibold">
            Confirm Purchase
          </DialogTitle>
        </DialogHeader>

        <div className="border-brand-primary relative flex items-start gap-4 overflow-hidden rounded-r-lg border-l-4 bg-slate-50/80 p-4 shadow-sm dark:bg-slate-900/50">
          <div className="bg-brand-primary/5 pointer-events-none absolute inset-0" />
          <Info className="text-brand-primary mt-0.5 h-5 w-5 shrink-0" />
          <p className="text-sm leading-relaxed opacity-90">
            Please review your purchase details carefully before confirming. A message will be sent to the seller
            immediately upon confirmation to notify the seller
          </p>
        </div>

        <div className="border-border bg-muted/30 mt-4 space-y-3 rounded-lg border p-4">
          <div className="border-border flex items-center justify-between border-b pb-3">
            <span className="text-muted-foreground text-xs">Amount to Buy</span>
            <span className="text-foreground text-lg font-bold">
              {formatCurrency(amountToBuy)}{' '}
              <span className="text-muted-foreground text-sm">{APP_CONFIG.CHAIN_SYMBOL}</span>
            </span>
          </div>

          <div className="border-border flex items-center justify-between border-b pb-3">
            <span className="text-muted-foreground text-xs">Amount to Pay</span>
            <span className="text-lg font-bold text-green-400">
              {formatCurrency(amountToPay)} <span className="text-sm">VND</span>
            </span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-muted-foreground text-xs">Exchange Rate</span>
            <span className="text-brand-primary font-semibold">
              {formatCurrency(priceRate)} VND/{APP_CONFIG.CHAIN_SYMBOL}
            </span>
          </div>
        </div>

        <div className="mt-4 flex flex-col space-y-4">
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-brand-primary shadow-primary/10 hover:bg-primary-light mt-2 w-full rounded-xl py-3 text-sm font-semibold text-white shadow-lg transition"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
              </>
            ) : (
              'Confirm & Continue'
            )}
          </Button>

          <Button
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            variant="outline"
            className="w-full rounded-xl text-center text-xs transition disabled:opacity-50"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
