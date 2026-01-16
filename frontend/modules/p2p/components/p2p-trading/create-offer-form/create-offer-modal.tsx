'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus, Send, Loader2, Info } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { useTransfer } from '@/modules/transfer/hooks/useTransfer';
import { CreateOfferRequest, TradeTypes } from '@/modules/p2p/types';
import { useCreateOffer } from '@/modules/p2p/hooks/useCreateOffer';
import { CreateOfferFormValues, createOfferSchema } from './validation-schema';
import { TradeTypeSection } from './trade-type-section';
import { AmountSection } from './amount-section';
import { PaymentSection } from './payment-section';
import { APP_CONFIG } from '@/configs/app.config';
import { useUser } from '@/providers';
import { mmnClient } from '@/modules/auth';
import { NumberUtil } from '@/utils';
import { ETransferType } from '@/modules/transaction';

export const CreateOfferModal = () => {
  const [open, setOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingData, setPendingData] = useState<CreateOfferFormValues | null>(null);
  const { mutateAsync: createOfferAsync, isPending } = useCreateOffer();
  const { transfer } = useTransfer();
  const { user } = useUser();
  const [balance, setBalance] = useState<string>('0');
  const formSchema = useMemo(() => {
    return createOfferSchema.superRefine((data, ctx) => {
      if (data.side === TradeTypes.SELL) {
        if (data.amount > Number(balance.replace(/,/g, ''))) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Insufficient balance',
            path: ['amount'],
          });
        }
      }
    });
  }, [balance]);
  const form = useForm<CreateOfferFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      side: TradeTypes.SELL,
      amount: 0,
      price_rate: '0',
      limit: { min: 0, max: 0 },
      bank_info: { bank: 'MB' as const, account_name: '', account_number: '' },
      symbol: 'MZD',
    },
    mode: 'onChange',
  });

  useEffect(() => {
    if (open) {
      form.reset({
        side: TradeTypes.SELL,
        amount: 0,
        price_rate: '0',
        limit: { min: 0, max: 0 },
        bank_info: { bank: 'MB', account_name: '', account_number: '' },
        symbol: 'MZD',
      });
      setShowConfirm(false);
      setPendingData(null);
    }
  }, [open, form]);

  useEffect(() => {
    let mounted = true;
    const fetchBalance = async () => {
      if (!open || !user?.id) return;

      try {
        const account = await mmnClient.getAccountByUserId(user.id);
        if (mounted && account?.balance) {
          setBalance(NumberUtil.formatWithCommasAndScale(account.balance));
        }
      } catch (error) {
        console.error('Fetch balance error:', error);
      }
    };
    fetchBalance();
    return () => {
      mounted = false;
    };
  }, [open, user?.id]);

  const onPreSubmit = (data: CreateOfferFormValues) => {
    setPendingData(data);
    setShowConfirm(true);
  };

  const handleFinalSubmit = async () => {
    if (!pendingData) return;

    const payload: CreateOfferRequest = {
      ...pendingData,
      amount: pendingData.amount,
      price_rate: pendingData.price_rate,
      limit: {
        min: pendingData.limit.min,
        max: pendingData.limit.max,
      },
    };

    try {
      const resultData = await createOfferAsync(payload);
      const transferResult = await transfer(
        {
          recipientAddress: resultData.intermediary_wallet_address,
          amount: payload.amount.toString(),
          note: 'p2p-trading',
          offerId: resultData.offer.offer_id,
        },
        ETransferType.P2PTrading
      );

      if (transferResult.success) {
        toast.success('Your offer is being processed. Please wait a moment.');
        setShowConfirm(false);
        setOpen(false);
      } else {
        toast.error(JSON.parse(transferResult.error || '').message || 'Create offer fail. Please try again.');
        console.error(transferResult.error);
        setShowConfirm(false);
      }
    } catch (error) {
      console.error('Error creating offer:', error);
      setShowConfirm(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="bg-brand-primary h-10 w-full shrink-0 gap-1 rounded-lg font-bold text-white shadow-sm transition-all md:w-auto md:px-5">
            <Plus className="h-4 w-4" />
            New Offer
          </Button>
        </DialogTrigger>

        <DialogContent className="border-border max-w-6xl overflow-y-auto border">
          <DialogHeader className="border-b--border mx-6 -mt-6 border-b py-4">
            <DialogTitle className="text-brand-primary text-lg font-bold">Create New Offer</DialogTitle>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onPreSubmit)}>
            <div className="grid grid-cols-1 gap-8 p-6 lg:grid-cols-3">
              <TradeTypeSection control={form.control} trigger={form.trigger} />
              <AmountSection
                control={form.control}
                trigger={form.trigger}
                userBalance={balance}
                setValue={form.setValue}
              />
              <PaymentSection control={form.control} />
            </div>

            <DialogFooter className="border-t-border -mx-6 -mb-6 flex justify-end gap-3 border-t px-4 py-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                disabled={isPending}
                className="text-muted-foreground px-5 py-2 text-sm font-medium"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-brand-primary flex items-center gap-2 px-8 py-2 text-sm font-bold text-white shadow-lg transition disabled:opacity-70"
              >
                <Send className="h-3 w-3" />
                Create Offer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} className="sm:max-w-106.25">
          <DialogHeader>
            <DialogTitle className="text-brand-primary pb-2 text-left text-lg font-semibold">
              Confirm Offer Creation
            </DialogTitle>
          </DialogHeader>

          <div className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/50">
            <Info className="text-brand-primary mt-0.5 h-5 w-5 shrink-0" />
            <p className="text-muted-foreground text-sm leading-relaxed">
              To activate this <span className="font-semibold">{pendingData?.side}</span> offer, you need to transfer{' '}
              <span className="text-brand-primary font-bold">
                {pendingData?.amount ? Number(pendingData.amount).toLocaleString() : '0'} {APP_CONFIG.CHAIN_SYMBOL}
              </span>{' '}
              to the system wallet. Please click the{' '}
              <span className="text-brand-primary font-bold">Confirm & Transfer</span> button to proceed.
            </p>
          </div>

          <div className="mt-4 flex flex-col space-y-4">
            <Button
              onClick={handleFinalSubmit}
              disabled={isPending}
              className="bg-brand-primary shadow-primary/30 hover:bg-primary-light mt-2 w-full rounded-xl py-3 text-sm font-semibold text-white shadow-lg transition"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
                </>
              ) : (
                'Confirm & Transfer'
              )}
            </Button>

            <Button
              onClick={() => setShowConfirm(false)}
              disabled={isPending}
              className="hover:text-foreground bg-brand-primary w-full rounded-xl text-center text-xs text-white transition disabled:opacity-50"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
