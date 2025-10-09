'use client'
import { NumberUtil } from '@/utils';
import { CircleDollarSign } from 'lucide-react';
import { useState, useCallback,useEffect } from 'react';
import { Button } from '@/components/ui/button'
import { useTransfer } from '../hooks/useTransfer';
import { toast } from "sonner"
import { mmnClient } from '../utils';

export const Transfer = () => {
  const { transfer, loading } = useTransfer();
  const [form, setForm] = useState({
    address: '',
    note: '',
    amount: '',
    rawAmount: '',
  })
  const [showBalanceWarning, setShowBalanceWarning] = useState(false);

  const senderId = '1965353346269188096';
  const [senderBalance, setSenderBalance] = useState<string>('0');
  useEffect(() => {
    let mounted = true;
    mmnClient
      .getAccountByUserId(senderId)
      .then((acc) => {
        if (mounted && acc && acc.balance != null) setSenderBalance(String(acc.balance));
      })
      .catch((err) => {
        console.error('Failed to load sender account:', err);
      });
    return () => {
      mounted = false;
    };
  }, [senderId]);

  const handleInputChange = (field: keyof typeof form) => 
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value

      if (field === 'amount') {
        const numeric = value.replace(/[^0-9]/g, '')
        setForm(prev => ({
          ...prev,
          rawAmount: numeric,
          amount: NumberUtil.formatNumber(Number(numeric)),
        }))
        setShowBalanceWarning(false);
      } else {
        setForm(prev => ({ ...prev, [field]: value }))
      }
    }

  const resetForm = () => setForm({ address: '', note: '', amount: '', rawAmount: '' })

  const handleTransfer = useCallback(async () => {
    const { address, rawAmount, note } = form;
  try {
   const senderBalanceValue = senderBalance;

    if (!address.trim()) {
      toast.error("Please enter recipient address");
      return;
    }

    if (!mmnClient.validateAddress(address)) {
      toast.error("Invalid recipient address");
      return;
    }

    if (!rawAmount || Number(rawAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!mmnClient.validateAmount(senderBalanceValue, rawAmount)) {
      toast.error("Insufficient balance");
          setShowBalanceWarning(true);
      return;
    }

    const result = await transfer({
      recipientAddress: address,
      amount: rawAmount,
      note,
    });

    if (result.success) {
      toast.success("Transfer successful!");
      resetForm();
          setShowBalanceWarning(false);
    } else {
      toast.error(result.error || "Transfer failed. Please try again.");
    }
  } catch (error: any) {
    console.error("Transfer error:", error);
    toast.error(error?.message || "Unexpected error occurred during transfer.");
  }
}, [form, transfer]);

  return (
    <div className='flex flex-col items-center justify-center w-full h-full py-10 px-4'>
    <div className="grid w-full max-w-lg gap-4 border bg-background p-6 shadow-lg sm:rounded-lg">
      <div className="sm:max-w-md bg-background w-full">
        <div className="flex items-center justify-between flex-row px-6 py-2 border-b">
          <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-muted text-primary flex items-center justify-center">
                <CircleDollarSign className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-primary">Transfer</h2>
              </div>
            </div>
        </div>

        <div className="p-6 space-y-4">
            {[
              { label: 'Address', field: 'address', placeholder: 'Enter address' },
              { label: 'Amount', field: 'amount', placeholder: '0' },
              { label: 'Note (Optional)', field: 'note', placeholder: 'Say something nice' },
            ].map(({ label, field, placeholder }) => (
              <div key={field} className="space-y-2">
                <label className="block text-sm text-primary font-medium">{label}</label>
                <input
                  type="text"
                  value={form[field as keyof typeof form] as string}
                  onChange={handleInputChange(field as keyof typeof form)}
                  className="w-full h-12 px-4 bg-muted border border-muted-foreground rounded-xl outline-none focus:ring-1 focus:ring-primary transition-all"
                  placeholder={placeholder}
                />
              </div>
            ))}
            {showBalanceWarning && (
              <div className="px-4 text-sm text-destructive mt-1">
                Insufficient balance — your balance: {senderBalance}
              </div>
            )}
          </div>

        <div className="flex gap-3 px-6 py-4 border-t ">
          <Button
            onClick={handleTransfer}
            disabled={
              loading ||
              !form.address.trim() ||
              !form.rawAmount ||
              Number(form.rawAmount) <= 0
            }
            className="flex-1 bg-primary hover:bg-ring text-background font-semibold py-4">
            {loading ? 'Sending...' : 'Give Coffee'}
          </Button>
        </div>

      </div>
    </div>
    </div>
  )
};
