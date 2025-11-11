'use client';
import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { mmnClient } from '@/modules/auth/utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogTrigger, DialogHeader } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useTransfer } from '@/modules/transfer/hooks/useTransfer';
import { NumberUtil } from '@/utils';
import { APP_CONFIG } from '@/configs/app.config';
import { CopyButton } from '@/components/ui/copy-button';
import { TRANSACTIONS_QUERY_KEY } from '@/modules/transaction';
import { useQueryClient } from '@tanstack/react-query';
import { Check } from 'lucide-react';

export function DonateDialog({ walletAddress }: { walletAddress: string }) {
  const { transfer, loading, user } = useTransfer();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [form, setForm] = useState({
    amount: '',
    note: '',
  });
  const queryClient = useQueryClient();
  const [senderBalance, setSenderBalance] = useState<string>('0');
  const [transactionHash, setTransactionHash] = useState<string>('');

  const refreshBalance = useCallback(async () => {
    if (!user?.id) return;
    try {
      const account = await mmnClient.getAccountByUserId(user.id);
      setSenderBalance(account.balance);
    } catch (err) {
      console.error('Failed to load balance:', err);
      toast.error('Failed to load balance.');
    }
  }, [user?.id]);

  useEffect(() => {
    if (isDialogOpen && user?.id) {
      refreshBalance();
      setTransactionHash('');
      resetForm();
    }
  }, [isDialogOpen, user?.id, refreshBalance]);

  const handleInputChange =
    (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { value } = e.target;
      if (field === 'amount') {
        let numeric = value.replace(/[^0-9]/g, '');
        if (numeric.length > 1 && numeric.startsWith('0')) {
          numeric = numeric.replace(/^0+/, '');
        }
        const limitedValue = numeric.slice(0, 15);
        setForm((prev) => ({ ...prev, amount: limitedValue }));
      } else {
        setForm((prev) => ({ ...prev, [field]: value }));
      }
    };
  const resetForm = () => setForm({ amount: '', note: '' });

  const handleDonate = useCallback(async () => {
    try {
      const result = await transfer(
        {
          recipientAddress: walletAddress,
          amount: form.amount,
          note: form.note.trim(),
        },
        'donation-campaign'
      );
      if (result.success) {
        toast.success('Donation success!');
        setTransactionHash(result.txHash || '');
        setTimeout(async () => await queryClient.invalidateQueries({ queryKey: [TRANSACTIONS_QUERY_KEY] }), 1000);
      } else {
        toast.error(result.error || 'Donation fail. Please try again.');
      }
    } catch (error) {
      console.error('Donation error:', error);
      toast.error('Something is broken');
    }
  }, [form, walletAddress, transfer, queryClient]);

  const isButtonDisabled =
    loading || !form.amount || !mmnClient.validateAmount(senderBalance, mmnClient.scaleAmountToDecimals(form.amount));

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button
          size="lg"
          className="bg-brand-primary hover:bg-brand-primary/70 focus-visible:outline-primary inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-lg transition focus-visible:outline-offset-2"
        >
          Donate Now
        </Button>
      </DialogTrigger>

      <DialogContent
        onOpenAutoFocus={(e) => {
          e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-brand-primary text-left text-lg font-semibold">
            {!transactionHash ? 'Donation campaign' : null}
          </DialogTitle>
        </DialogHeader>

        {transactionHash ? (
          <div className="flex flex-col items-center space-y-5 text-center">
            <div className="flex flex-col items-center space-y-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                <Check className="h-7 w-7 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-green-600">Donation confirmed!</h3>
              <p className="text-sm text-gray-500">You're part of something bigger now.</p>
            </div>

            <div className="bg-brand-primary/10 border-brand-primary/40 borde mt-1 w-full rounded-xl p-5 focus:ring-0 focus:outline-none">
              <div className="flex flex-col items-center space-y-4">
                <div className="text-center">
                  <p className="text-xs uppercase">Amount Donated</p>
                  <p className="text-brand-primary text-3xl font-bold">
                    {NumberUtil.formatWithCommas(form.amount)}
                    <span className="ml-1.5 text-xl font-medium">{APP_CONFIG.CHAIN_SYMBOL}</span>
                  </p>
                </div>

                <div className="w-full border-t"></div>

                <div className="w-full space-y-2 text-left">
                  <p className="text-xs uppercase">Transaction Hash</p>
                  <div className="flex items-center gap-2">
                    <p className="text-card-foreground flex-1 truncate font-mono text-sm">{transactionHash}</p>
                    <CopyButton textToCopy={transactionHash} />
                  </div>
                </div>
              </div>
            </div>

            <Button
              onClick={() => setIsDialogOpen(false)}
              className="bg-brand-primary hover:bg-brand-primary/85 w-full rounded-xl py-3 text-sm font-semibold text-white shadow-lg transition"
            >
              Close
            </Button>
          </div>
        ) : (
          <div className="mt-4 flex flex-col space-y-4">
            <div>
              <Input
                label="Recipient's address"
                id="recipient-address"
                className="bg-brand-primary/10 border-brand-primary/40 mt-1 focus:ring-0 focus:outline-none"
                type="text"
                value={walletAddress}
                readOnly
              />
            </div>
            <div>
              <Input
                label="Amount"
                id="amount"
                placeholder="0.0"
                className="bg-brand-primary/10 border-brand-primary/40 mt-1 focus:ring-0 focus:outline-none"
                type="text"
                value={NumberUtil.formatWithCommas(form.amount)}
                onChange={handleInputChange('amount')}
                disabled={loading}
              />
            </div>

            <div className="text-brand-primary flex justify-end text-sm">
              <span>
                Balance: {NumberUtil.formatWithCommasAndScale(senderBalance)} {APP_CONFIG.CHAIN_SYMBOL}
              </span>
            </div>
            <div>
              <Textarea
                id="note"
                label="Note"
                placeholder="Leave a message..."
                className="bg-card mt-1"
                value={form.note}
                onChange={handleInputChange('note')}
                disabled={loading}
              />
            </div>

            <Button
              onClick={handleDonate}
              disabled={isButtonDisabled}
              type="submit"
              className="bg-brand-primary shadow-primary/30 hover:bg-primary-light w-full rounded-xl py-3 text-sm font-semibold text-white shadow-lg transition"
            >
              {loading ? 'Donating' : 'Confirm'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
