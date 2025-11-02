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
        setForm((prev) => ({ ...prev, [field]: value.trim() }));
      }
    };
  const resetForm = () => setForm({ amount: '', note: '' });

  const handleDonate = useCallback(async () => {
    try {
      const result = await transfer(
        {
          recipientAddress: walletAddress,
          amount: form.amount,
          note: form.note,
        },
        'donation-campaign'
      );
      if (result.success) {
        toast.success('Donation success!');
        resetForm();
        setTransactionHash(result.txHash || '');
        await queryClient.invalidateQueries({ queryKey: [TRANSACTIONS_QUERY_KEY] });
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
          <DialogTitle className="text-brand-primary text-left text-lg font-semibold">Donation campaign</DialogTitle>
        </DialogHeader>

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
          {transactionHash && (
            <div className="flex flex-col space-y-2">
              <span className="text-primary text-sm font-medium">Transaction Hash:</span>
              <div className="flex items-center gap-2 rounded-md bg-gray-100 p-2">
                <p className="flex-1 truncate border-0 bg-inherit p-0 font-mono text-sm text-gray-800">
                  {transactionHash}
                </p>
                <CopyButton textToCopy={transactionHash} />
              </div>
            </div>
          )}
          <div>
            <Textarea
              id="note"
              label="Note"
              placeholder="Leave a message..."
              className="mt-1"
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
      </DialogContent>
    </Dialog>
  );
}
