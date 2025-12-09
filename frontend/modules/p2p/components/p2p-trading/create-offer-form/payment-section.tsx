'use client';

import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BankOption } from '@/modules/p2p/types';
import { CreditCard, Info, User } from 'lucide-react';

interface PaymentSectionProps {
  bank: BankOption;
  accountNumber: string;
  accountName: string;
  onBankChange: (bank: BankOption) => void;
  onAccountNumberChange: (account: string) => void;
  onAccountNameChange: (name: string) => void;
  error?: string;
  accountNameError?: string;
}

const bankOptions: { value: BankOption; label: string }[] = [
  { value: 'MB', label: 'MB Bank' },
  { value: 'VCB', label: 'Vietcombank' },
  { value: 'TCB', label: 'Techcombank' },
  { value: 'ACB', label: 'ACB' },
  { value: 'TPBANK', label: 'TPBank' },
  { value: 'VIETCOMBANK', label: 'Vietcombank' },
];

export const PaymentSection = ({
  bank,
  accountNumber,
  accountName,
  onBankChange,
  onAccountNumberChange,
  onAccountNameChange,
  error,
  accountNameError,
}: PaymentSectionProps) => {
  return (
    <div className="space-y-5">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-white">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-800 text-xs text-gray-400">
          3
        </span>
        Payment
      </h3>

      {/* Select Bank */}
      <div>
        <label className="mb-2 block text-xs font-medium text-gray-500 uppercase">Bank Name</label>
        <Select value={bank} onValueChange={(value) => onBankChange(value as BankOption)}>
          <SelectTrigger className="bg-input/30 dark:bg-input/30 focus:border-brand-primary w-full cursor-pointer rounded-md border-gray-700 px-3 py-2.5 text-sm text-white focus:outline-none">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {bankOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Account Number */}
      <div>
        <label className="mb-2 block text-xs font-medium text-gray-500 uppercase">Account Number</label>
        <div className="relative">
          <Input
            type="text"
            placeholder="Enter account number"
            value={accountNumber}
            onChange={(e) => onAccountNumberChange(e.target.value)}
            className={`bg-input/30 dark:bg-input/30 focus:border-brand-primary w-full rounded-md border-gray-700 px-3 py-2.5 text-sm text-white focus:outline-none ${
              error ? 'border-red-500' : ''
            }`}
          />
          <div className="absolute top-3 right-3 text-gray-500">
            <CreditCard className="h-3 w-3" />
          </div>
        </div>
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>

      {/* Account Name */}
      <div>
        <label className="mb-2 block text-xs font-medium text-gray-500 uppercase">Account Name</label>
        <div className="relative">
          <Input
            type="text"
            placeholder="Enter account owner name"
            value={accountName}
            onChange={(e) => onAccountNameChange(e.target.value.toUpperCase())}
            className={`bg-input/30 dark:bg-input/30 focus:border-brand-primary w-full rounded-md border-gray-700 px-3 py-2.5 text-sm text-white focus:outline-none ${
              accountNameError ? 'border-red-500' : ''
            }`}
          />
          <div className="absolute top-3 right-3 text-gray-500">
            <User className="h-3 w-3" />
          </div>
        </div>
        {accountNameError && <p className="mt-1 text-xs text-red-500">{accountNameError}</p>}
      </div>

      <div className="mt-2 rounded border border-blue-500/10 bg-blue-500/5 p-3">
        <p className="flex items-start gap-2 text-xs leading-relaxed text-blue-400">
          <Info className="mt-0.5 h-3 w-3 flex-shrink-0" />
          <span>Note: The bank account owner name must match your KYC name on Mezon.</span>
        </p>
      </div>
    </div>
  );
};
