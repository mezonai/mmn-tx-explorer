import { useCancelOffer } from '../../hooks';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogTrigger, DialogHeader } from '@/components/ui/dialog';
import { useState } from 'react';
import { P2POffer } from '../../types';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { APP_CONFIG } from '@/configs/app.config';
import { formatCurrency } from '@/modules/p2p/util';

interface CancelConfirmDialogProps {
  offer: P2POffer;
}

export const CancelConfirmDialog = ({ offer }: CancelConfirmDialogProps) => {
  const [open, setOpen] = useState(false);
  const { mutateAsync: cancelOfferAsync, isPending } = useCancelOffer();
  const router = useRouter();
  const totalVND = offer.price_rate > 0 ? offer.amount * offer.price_rate : 0;

  const handleCancel = async () => {
    if (offer) {
      try {
        await cancelOfferAsync(offer.offer_id);
        toast.success('Offer cancelled successfully');
        setOpen(false);
      } catch {
        toast.error('Failed to cancel offer');
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild />
      <Button
        variant="destructive"
        className="hover:bg-destructive/70 dark:hover:bg-destructive/80 w-full rounded-lg px-6 py-2 font-bold"
        onClick={() => setOpen(true)}
      >
        Cancel Offer
      </Button>
      <DialogContent className="border-border max-h-[90vh] max-w-4xl overflow-y-auto border sm:max-w-[95vw] md:max-w-3xl">
        <DialogHeader className="order-b--border mx-3 -mt-6 border-b py-3 sm:mx-6 sm:py-4">
          <DialogTitle className="text-primary text-base font-bold sm:text-lg">
            Are you sure you want to cancel this offer?
          </DialogTitle>
        </DialogHeader>
        <div className="mt-2 flex flex-col gap-2 sm:mt-4">
          <div className="grid grid-cols-1 gap-4 p-3 sm:gap-6 sm:p-4 lg:grid-cols-2 lg:gap-8 lg:p-6">
            <div className="border-border space-y-3 border-b pb-4 sm:space-y-4 lg:border-r lg:border-b-0 lg:pr-6 lg:pb-0">
              <div className="flex items-center gap-2">
                <span className="bg-card text-muted-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs">
                  1
                </span>
                <h3 className="text-foreground text-xs font-semibold sm:text-sm">Order Type & Asset</h3>
              </div>

              <div className="border-brand-primary bg-card rounded-lg border p-2 sm:p-3">
                <label className="text-brand-primary mb-1.5 block text-[10px] font-medium sm:mb-2 sm:text-xs">
                  Sell Rate (VND/{APP_CONFIG.CHAIN_SYMBOL})
                </label>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="flex-1">
                    <div className="bg-input/30 text-foreground w-full rounded border px-2 py-1 text-xs focus:outline-none sm:px-3 sm:py-1.5 sm:text-sm">
                      {offer.price_rate}
                    </div>
                  </div>

                  <span className="text-muted-foreground text-[10px] whitespace-nowrap sm:text-xs">
                    VND/{APP_CONFIG.CHAIN_SYMBOL}
                  </span>
                </div>

                <div className="border-border mt-1.5 border-t pt-1.5 sm:mt-2 sm:pt-2">
                  <div className="text-center">
                    <p className="text-brand-primary mb-0.5 text-[10px] sm:text-xs">Exchange rate</p>
                    <p className="text-foreground text-sm font-bold sm:text-base lg:text-lg">
                      1 {APP_CONFIG.CHAIN_SYMBOL} = {offer.price_rate}VND
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-muted-foreground mb-1.5 block text-[10px] font-medium sm:mb-2 sm:text-xs">
                  Transaction Limits ({APP_CONFIG.CHAIN_SYMBOL})
                </label>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <div>
                    <label className="text-muted-foreground mb-1 block text-[10px] sm:text-xs">Minimum</label>
                    <div className="bg-input/30 text-foreground flex w-full justify-between rounded border px-1.5 py-1 text-xs sm:px-2 sm:py-1.5 sm:text-sm">
                      {offer.limit.min}
                      <span className="pt-0.5 text-[10px] text-gray-500 sm:text-xs">{APP_CONFIG.CHAIN_SYMBOL}</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-muted-foreground mb-1 block text-[10px] sm:text-xs">Maximum</label>
                    <div className="bg-input/30 text-foreground flex w-full justify-between rounded border px-1.5 py-1 text-xs sm:px-2 sm:py-1.5 sm:text-sm">
                      {offer.limit.max}
                      <span className="pt-0.5 text-[10px] text-gray-500 sm:text-xs">{APP_CONFIG.CHAIN_SYMBOL}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="border-border space-y-3 border-b pb-4 sm:space-y-4 lg:space-y-5 lg:border-r lg:border-b-0 lg:pr-8 lg:pb-0">
              <h3 className="mb-2 flex items-center gap-2 text-xs font-bold sm:mb-3 sm:text-sm">
                <span className="bg-card text-muted-foreground flex h-5 w-5 items-center justify-center rounded-full text-xs">
                  2
                </span>
                <span className="text-foreground">Trading Volume</span>
              </h3>

              <div>
                <label className="text-muted-foreground mb-1.5 block text-[10px] font-medium uppercase sm:mb-2 sm:text-xs">
                  Amount to Sell ({APP_CONFIG.CHAIN_SYMBOL})
                </label>
                <div className="group relative">
                  <div className="bg-input/30 border-border w-full rounded-md border px-2 py-2 text-sm font-bold sm:px-3 sm:py-2.5 sm:text-base lg:text-lg">
                    {formatCurrency(offer.amount)}

                    <span className="absolute top-2 right-2 text-[10px] font-bold text-gray-500 sm:top-2.5 sm:text-xs lg:top-4.5">
                      {APP_CONFIG.CHAIN_SYMBOL}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-1 sm:pt-2">
                <label className="text-muted-foreground mb-1.5 block text-[10px] font-medium uppercase sm:mb-2 sm:text-xs">
                  Total Received (VND)
                </label>
                <div className="border-border bg-card flex h-20 flex-col items-center justify-center rounded-lg border px-3 py-3 sm:h-24 sm:px-4 sm:py-4">
                  <span className="text-utility-success-600 text-base font-bold sm:text-lg lg:text-xl">
                    {formatCurrency(totalVND)}
                  </span>
                  <span className="text-muted-foreground mt-0.5 text-[10px] font-bold sm:mt-1 sm:text-xs">VND</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col justify-end gap-2 px-3 pb-2 sm:flex-row sm:gap-3 sm:px-4 sm:pb-0 lg:px-6">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
              className="w-full text-sm sm:w-auto sm:text-base"
            >
              No, Keep Offer
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={isPending}
              className="w-full text-sm sm:w-auto sm:text-base"
            >
              {isPending ? 'Cancelling…' : 'Yes, Cancel Offer'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
