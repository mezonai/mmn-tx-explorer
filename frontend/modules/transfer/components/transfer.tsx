'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { mmnClient } from '@/modules/auth/utils';
import { NumberUtil } from '@/utils';
import { useTransfer } from '../hooks/useTransfer';
import { toast } from 'sonner';
import { InputForm } from '@/components/ui/input-form';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/page-header';
import { APP_CONFIG } from '@/configs/app.config';

const safeValidateAddress = (address: string): boolean => {
  try {
    return mmnClient.validateAddress(address);
  } catch {
    return false;
  }
};

export const Transfer = () => {
  const { transfer, loading, storage } = useTransfer();
  const [form, setForm] = useState({
    address: '',
    note: '',
    amount: '',
  });
  const [senderBalance, setSenderBalance] = useState<string>('0');

  const ScaleDownBalance = NumberUtil.formatWithCommasAndScale(senderBalance);
  const userId = useMemo(
    () =>
      storage.user?.user_id ||
      (storage.user as any)?.sub ||
      (storage.user as any)?.mezon_id ||
      (storage.user as any)?.id ||
      '',
    [storage.user]
  );

  const refreshBalance = useCallback(async () => {
    if (!userId) return;
    try {
      const account = await mmnClient.getAccountByUserId(userId);
      setSenderBalance(account.balance);
    } catch (err) {
      console.error('Failed to load balance:', err);
    }
  }, [userId]);

  useEffect(() => {
    refreshBalance();
  }, [refreshBalance]);

  const handleInputChange = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    if (field === 'amount') {
      const numeric = value.replace(/[^0-9.]/g, '');
      const parts = numeric.split('.');
      const cleanNumeric = parts[0] + (parts.length > 1 ? '.' + parts[1] : '');

      setForm((prev) => ({
        ...prev,
        amount: cleanNumeric,
      }));
    } else {
      setForm((prev) => ({ ...prev, [field]: value }));
    }
  };

  const resetForm = () => setForm({ address: '', note: '', amount: '' });

  const handleTransfer = useCallback(async () => {
    const { address, amount, note } = form;
    try {
      if (!amount.trim() || Number(amount) <= 0) {
        toast.error('Please enter a valid amount');
        return;
      }
      const result = await transfer({
        recipientAddress: address,
        amount: amount,
        note,
      });

      if (result.success) {
        toast.success('Transfer successful!');
        resetForm();
        setTimeout(() => {
          refreshBalance();
        }, 1000);
      } else {
        toast.error(result.error || 'Transfer failed. Please try again.');
      }
    } catch (error: any) {
      console.error('Transfer error:', error);
      toast.error(error?.message || 'Unexpected error occurred during transfer.');
    }
  }, [form, transfer, refreshBalance]);

  return (
    <div className="h-full w-full px-4 sm:px-6 lg:px-8">
      <PageHeader
        title="Give Coffee"
        header="Send Mezon Đồng to another address."
        description="Show some love—send a coffee to support someone’s day."
      />
      <div className="border-primary/50 mx-auto mt-8 w-full max-w-3xl rounded-3xl border bg-white/5 p-6 text-left shadow-md dark:border-white/10">
        <div className="mx-auto grid max-w-3xl gap-3 text-sm sm:grid-cols-1">
          <div className="bg-primary/10 shadow-primary/20 flex flex-col rounded-2xl border-none px-2 py-2 text-left shadow-md">
            <div className="text-primary dark:text-primary-light shadow-primary/20 px-2 text-left text-lg text-sm font-semibold">
              Send Mezon Đồng
            </div>
            <p className="text-primary-light mt-2 px-2 text-left text-sm text-xs">Transfer funds wallet-to-wallet</p>
          </div>
          <div className="hidden rounded-2xl px-2 py-2 text-left">
            <div className="text-gray hover:border-primary/40 px-2 text-left text-lg text-sm font-semibold transition hover:text-white">
              Buy give via Stripe
            </div>
            <p className="text-grey mt-2 px-2 text-left text-sm text-xs">Purchased curated packs in USD</p>
          </div>
        </div>

        <div className="mx-auto mt-2 grid max-w-3xl gap-8 py-7">
          <div className="bg-primary/10 border-primary/40 shadow-primary/20 flex flex-col rounded-3xl border p-6 text-left shadow-lg lg:p-8">
            <div className="text-primary dark:text-primary-light text-left text-lg font-semibold">Send Mezon Đồng</div>
            <p className="text-primary-light/80 mt-2 text-left text-sm">
              Funds are transferred instantly once the transaction is confirmed on-chain.
            </p>
            <div className="mt-6 flex-1 space-y-5 text-sm text-gray-200">
              <div>
                <InputForm
                  placeholder="Recipent's Address"
                  label="Recipient"
                  className="mt-2"
                  type="text"
                  value={form.address}
                  onChange={handleInputChange('address')}
                />
              </div>
              <div>
                <InputForm
                  label="Amount"
                  className="mt-2"
                  type="text"
                  value={NumberUtil.formatWithCommas(form.amount)}
                  suffix={APP_CONFIG.CHAIN_SYMBOL}
                  onChange={handleInputChange('amount')}
                />
              </div>

              <div className="flex justify-end">
                <span className="text-primary text-sm">
                  Balance: {ScaleDownBalance} {APP_CONFIG.CHAIN_SYMBOL}
                </span>
              </div>

              <div>
                <InputForm
                  placeholder="Leave a note..."
                  label="Message (optional)"
                  className="mt-2 h-[5rem]"
                  type="text"
                  value={form.note}
                  onChange={handleInputChange('note')}
                />
              </div>
              <Button
                onClick={handleTransfer}
                disabled={
                  loading ||
                  !form.address.trim() ||
                  !form.amount ||
                  !safeValidateAddress(form.address) ||
                  !mmnClient.validateAmount(senderBalance, mmnClient.scaleAmountToDecimals(form.amount))
                }
                type="submit"
                className="bg-primary shadow-primary/30 hover:bg-primary-light w-full rounded-xl py-3 text-sm font-semibold text-white shadow-lg transition"
              >
                {loading ? 'Sending...' : 'Give Coffee'}
              </Button>
            </div>
          </div>
          <div className="flex hidden flex-col rounded-3xl border border-white/10 bg-white/5 p-6 text-left lg:p-8">
            <div className="text-left text-lg font-semibold text-white">Type B · Buy Gift via Stripe</div>
            <p className="mt-2 text-left text-sm text-white">
              Pick a pack, pay in USD, and we deliver MEZ on your behalf.
            </p>
            <div className="mt-6 flex-1 space-y-5 text-sm text-gray-200">
              <div>
                <InputForm placeholder="bob.mez or bob@email.com" label="Receiver wallet / email" className="mt-2" />
              </div>
              <div>
                <InputForm placeholder="Card ending ••42" label="Payment method" className="mt-2" />
              </div>
              <div>
                <InputForm
                  placeholder="Add a note for the recipient"
                  label="Message (optional)"
                  className="mt-2 h-[5rem]"
                />
              </div>
              <Button
                type="submit"
                className="border-primary/30 bg-primary/20 text-primary-light shadow-primary/20 hover:border-primary/50 hover:bg-primary/30 w-full rounded-xl border py-3 text-sm font-semibold shadow-lg transition"
              >
                Pay with Stripe
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
