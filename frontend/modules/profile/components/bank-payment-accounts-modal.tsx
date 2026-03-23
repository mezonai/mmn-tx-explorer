'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreditCard, User, Info, Loader2 } from 'lucide-react';
import { BankOption, UserPaymentInfo } from '@/modules/p2p/types';
import { useUpdatePaymentInfo, useUserPaymentInfos } from '@/modules/p2p/hooks/usePaymentInfo';
import { toast } from 'sonner';
import { BANK_OPTIONS } from '@/modules/p2p/constants';

interface BankPaymentAccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentInfo?: UserPaymentInfo | null;
}

export const BankPaymentAccountsModal = ({ isOpen, onClose, paymentInfo }: BankPaymentAccountsModalProps) => {
  const { data: savedPayments } = useUserPaymentInfos();
  const { mutate: updatePayment, isPending } = useUpdatePaymentInfo();

  const [bank, setBank] = useState<BankOption>('MB');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    if (paymentInfo) {
      const bankOpt = BANK_OPTIONS.find((opt) => opt.label === paymentInfo.bank_name);
      if (bankOpt) setBank(bankOpt.value);
      setAccountNumber(paymentInfo.account_number);
      setAccountName(paymentInfo.account_name);
      setIsPrimary(paymentInfo.is_primary);
    } else {
      // For "Add New", default to MB and try to auto-fill if MB account already exists
      const defaultBank: BankOption = 'MB';
      setBank(defaultBank);
      const mbLabel = BANK_OPTIONS.find((opt) => opt.value === defaultBank)?.label;
      const matched = savedPayments?.find((p) => p.bank_name === mbLabel);
      if (matched) {
        setAccountNumber(matched.account_number);
        setAccountName(matched.account_name);
        setIsPrimary(matched.is_primary);
      } else {
        setAccountNumber('');
        setAccountName('');
        setIsPrimary(false);
      }
    }
  }, [paymentInfo, isOpen, savedPayments]);

  const handleBankChange = (value: BankOption) => {
    setBank(value);
    if (!paymentInfo && savedPayments) {
      const bankLabel = BANK_OPTIONS.find((opt) => opt.value === value)?.label;
      const matched = savedPayments.find((p) => p.bank_name === bankLabel);
      if (matched) {
        setAccountNumber(matched.account_number);
        setAccountName(matched.account_name);
        setIsPrimary(matched.is_primary);
      } else {
        setAccountNumber('');
        setAccountName('');
        setIsPrimary(false);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!accountNumber) {
      toast.error('Please enter the account number');
      return;
    }

    if (!/^\d+$/.test(accountNumber)) {
      toast.error('Account number must contain only digits');
      return;
    }

    if (!accountName) {
      toast.error('Please enter the account name');
      return;
    }

    const bankLabel = BANK_OPTIONS.find((b) => b.value === bank)?.label || bank;

    updatePayment(
      {
        id: paymentInfo?.id,
        bank_name: bankLabel,
        account_number: accountNumber,
        account_name: accountName,
        is_primary: isPrimary,
      },
      {
        onSuccess: () => {
          toast.success(paymentInfo ? 'Account updated' : 'Account added');
          onClose();
        },
        onError: (err: any) => {
          toast.error(err.response?.data?.message || 'Failed to save account');
        },
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border overflow-hidden rounded-2xl p-0 shadow-2xl sm:max-w-md">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="text-foreground text-lg font-semibold">
            {paymentInfo ? 'Edit Bank Account' : 'Add New Bank Account'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-4">
          {/* Bank Name - Reuse PaymentSection style */}
          <div>
            <label className="text-muted-foreground mb-2 block text-xs font-medium uppercase">Bank Name</label>
            <Select onValueChange={(v) => handleBankChange(v as BankOption)} value={bank}>
              <SelectTrigger className="border-border bg-input text-foreground w-full cursor-pointer rounded-md border px-3 py-2.5 text-sm focus:outline-none">
                <SelectValue placeholder="Select bank" />
              </SelectTrigger>
              <SelectContent>
                {BANK_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Account Number - Reuse PaymentSection style */}
          <div>
            <label className="text-muted-foreground mb-2 block text-xs font-medium uppercase">Account Number</label>
            <div className="relative">
              <Input
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                type="text"
                placeholder="Enter account number"
                maxLength={20}
                className="bg-input/30 text-foreground border-border w-full rounded-md border px-3 py-2.5 text-sm focus:outline-none"
              />
              <div className="text-muted-foreground absolute top-3.5 right-3">
                <CreditCard className="text-muted-foreground h-3 w-3" />
              </div>
            </div>
          </div>

          {/* Account Name - Reuse PaymentSection style */}
          <div>
            <label className="text-muted-foreground mb-2 block text-xs font-medium uppercase">Account Name</label>
            <div className="relative">
              <Input
                value={accountName}
                onChange={(e) => setAccountName(e.target.value.toUpperCase())}
                type="text"
                placeholder="Enter account owner name"
                className="bg-input/30 text-foreground border-border w-full rounded-md border px-3 py-2.5 text-sm focus:outline-none"
              />
              <div className="text-muted-foreground absolute top-3.5 right-3">
                <User className="text-muted-foreground h-3 w-3" />
              </div>
            </div>
          </div>

          {/* Primary Switch */}
          <div className="flex items-center justify-between pt-1">
            <label className="text-foreground cursor-pointer text-sm font-medium select-none" htmlFor="set-primary">
              Set as primary bank account
            </label>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                id="set-primary"
                className="peer sr-only"
                checked={isPrimary}
                onChange={(e) => setIsPrimary(e.target.checked)}
              />
              <div className="bg-muted peer-focus:ring-brand-primary/50 dark:bg-muted/50 peer-checked:bg-brand-primary dark:peer-checked:bg-brand-primary dark:border-border peer h-6 w-11 rounded-full peer-focus:ring-2 peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"></div>{' '}
            </label>
          </div>

          {/* Note Box - Reuse PaymentSection style */}
          <div className="border-brand-primary bg-card mt-2 rounded border p-3">
            <p className="flex items-start gap-2 text-xs leading-relaxed">
              <Info className="text-brand-primary mt-0.5 h-3 w-3 shrink-0" />
              <span className="text-muted-foreground">
                Note: Please ensure the Account Name entered matches exactly the bank account holder&apos;s name.
              </span>
            </p>
          </div>
        </form>

        <DialogFooter className="bg-muted/30 border-border gap-3 border-t px-6 py-4 sm:flex-row-reverse">
          <Button
            onClick={handleSubmit}
            disabled={isPending}
            className="bg-brand-primary hover:bg-brand-primary/90 h-10 w-full rounded-md px-6 font-bold text-white shadow-sm sm:w-auto"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {paymentInfo ? 'Save Changes' : 'Add Account'}
          </Button>
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-muted-foreground h-10 w-full px-6 hover:bg-transparent sm:w-auto"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
