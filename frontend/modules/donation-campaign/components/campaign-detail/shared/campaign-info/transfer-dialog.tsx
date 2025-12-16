'use client';
import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { mmnClient } from '@/modules/auth/utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogTrigger, DialogHeader } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { NumberUtil } from '@/utils';
import { DonationCampaignService } from '@/modules/donation-campaign/api';
import { APP_CONFIG } from '@/configs/app.config';
import { Eye, EyeOff } from 'lucide-react';
import { useTransferByPrivateKey } from '@/modules/transfer/hooks/useTransferByPrivateKey';
import { ETransferType } from '@/modules/transaction';
import { DonationCampaign } from '@/modules/donation-campaign/type';
import { TransactionComplete, TransactionType } from '@/modules/donation-campaign/components/transaction-complete';

const safeValidateAddress = (address: string): boolean => {
  try {
    return mmnClient.validateAddress(address);
  } catch {
    return false;
  }
};

export function TransferDialog({
  currentCampaign,
  walletAddress,
  myWalletAddress,
}: {
  currentCampaign: DonationCampaign;
  walletAddress: string;
  raisedAmount?: number;
  myWalletAddress?: string;
}) {
  const { transfer, loading } = useTransferByPrivateKey();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [form, setForm] = useState({
    privateKey: '',
    recipientAddress: '',
    amount: '',
    note: '',
  });

  const [currentBalanceValue, setCurrentBalanceValue] = useState<number>(0);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);
  const amountToSend = form.amount ? form.amount : NumberUtil.formatAndScaleDown(currentBalanceValue);

  const fetchBalance = useCallback(async () => {
    try {
      const updated = await DonationCampaignService.getCampaignById(currentCampaign.id);
      const newBalance = updated?.current_balance ?? currentCampaign.current_balance ?? 0;
      setCurrentBalanceValue(newBalance);
    } catch (error) {
      setCurrentBalanceValue(currentCampaign.current_balance ?? 0);
    }
  }, [currentCampaign]);

  useEffect(() => {
    if (isDialogOpen) {
      fetchBalance();
      if (myWalletAddress) {
        setForm((prev) => ({ ...prev, recipientAddress: myWalletAddress }));
      }
    }
  }, [isDialogOpen, fetchBalance, myWalletAddress]);

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

  const resetForm = () => setForm({ privateKey: '', recipientAddress: myWalletAddress || '', amount: '', note: '' });

  const handleTransfer = useCallback(async () => {
    try {
      if (!form.privateKey.trim()) {
        toast.error('Please enter your private key');
        return;
      }
      if (!form.recipientAddress.trim() || !safeValidateAddress(form.recipientAddress)) {
        toast.error('Please enter a valid destination wallet address');
        return;
      }
      if (form.amount && Number(form.amount) <= 0) {
        toast.error('Please enter a valid amount');
        return;
      }

      if (Number(amountToSend) > Number(currentBalanceValue)) {
        toast.error('Insufficient balance. Please enter a lower amount.');
        return;
      }

      const result = await transfer(
        {
          privateKey: form.privateKey.trim(),
          recipientAddress: form.recipientAddress.trim(),
          amount: amountToSend,
          note: form.note.trim(),
        },
        ETransferType.WithdrawCampaign,
        walletAddress
      );

      if (result.success) {
        toast.success('Transfer successful!');
        setWithdrawSuccess(true);
        await fetchBalance();
      } else {
        toast.error(result.error || 'Transfer failed. Please try again.');
      }
    } catch (error: any) {
      console.error('Transfer error:', error);
      toast.error(error?.message || 'Something went wrong');
    }
  }, [form, transfer, walletAddress, fetchBalance, currentBalanceValue, amountToSend]);

  const isButtonDisabled =
    loading || !form.privateKey.trim() || !form.recipientAddress.trim() || !safeValidateAddress(form.recipientAddress);
  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <button className="bg-brand-primary hover:bg-brand-primary/90 shadow-brand-primary/20 cursor-pointer rounded-lg px-5 py-2 text-sm font-semibold text-white shadow-lg">
          Withdraw Funds
        </button>
      </DialogTrigger>
      <DialogContent
        onOpenAutoFocus={(e) => {
          e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-brand-primary pb-4 text-left text-lg font-semibold">Withdraw Funds</DialogTitle>
        </DialogHeader>
        {withdrawSuccess ? (
          <TransactionComplete
            amount={NumberUtil.formatWithCommas(amountToSend)}
            symbol={APP_CONFIG.CHAIN_SYMBOL}
            type={TransactionType.Withdraw}
            onClose={() => {
              setWithdrawSuccess(false);
              setIsDialogOpen(false);
              resetForm();
            }}
          />
        ) : (
          <>
            <div className="rounded-xl border border-yellow-500/40 bg-yellow-500/10 p-3">
              <p className="text-xs font-medium text-yellow-600 dark:text-yellow-400">
                Your private key will never be stored — It’s used locally to sign the transaction.
              </p>
            </div>
            <div className="mt-2 flex flex-col space-y-4">
              <div className="text-brand-primary bg-brand-primary/5 text-sm">
                <span className="font-medium">
                  Current Balance: {NumberUtil.formatWithCommasAndScale(currentBalanceValue)} {APP_CONFIG.CHAIN_SYMBOL}
                </span>
              </div>
              <div>
                <label className="text-foreground mb-2 block text-sm font-medium">Private Key</label>
                <div className="relative">
                  <Input
                    placeholder="Enter your private key"
                    className="bg-brand-primary/10 border-brand-primary/40 pr-12 font-mono focus:ring-0 focus:outline-none"
                    type={showPrivateKey ? 'text' : 'password'}
                    value={form.privateKey}
                    onChange={handleInputChange('privateKey')}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPrivateKey(!showPrivateKey)}
                    className="text-brand-primary hover:text-brand-primary/70 absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer transition"
                  >
                    {showPrivateKey ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              <div>
                <Input
                  label="Destination Wallet Address"
                  id="recipient-address"
                  placeholder="Enter destination wallet address"
                  className="bg-brand-primary/10 border-brand-primary/40 mt-1 focus:ring-0 focus:outline-none"
                  type="text"
                  value={form.recipientAddress}
                  onChange={handleInputChange('recipientAddress')}
                  disabled={loading}
                />
              </div>
              <div>
                <Input
                  label="Amount (optional)"
                  id="amount"
                  placeholder="Leave blank to withdraw all funds"
                  className="bg-brand-primary/10 border-brand-primary/40 mt-1 focus:ring-0 focus:outline-none"
                  type="text"
                  value={form.amount ? NumberUtil.formatWithCommas(form.amount) : ''}
                  onChange={handleInputChange('amount')}
                  disabled={loading}
                />
              </div>
              <div>
                <Textarea
                  id="note"
                  label="Message (optional)"
                  placeholder="Leave a message..."
                  className="mt-1"
                  value={form.note}
                  onChange={handleInputChange('note')}
                  disabled={loading}
                />
              </div>
              <Button
                onClick={handleTransfer}
                disabled={isButtonDisabled}
                type="submit"
                className="bg-brand-primary shadow-primary/30 hover:bg-primary-light w-full rounded-xl py-3 text-sm font-semibold text-white shadow-lg transition"
              >
                {loading ? 'Withdrawing...' : 'Confirm Withdraw'}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
