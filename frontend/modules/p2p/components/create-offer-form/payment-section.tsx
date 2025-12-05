'use client';

import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BankOption } from '../../types/p2p.types';
import { CreditCard, Info } from 'lucide-react';

interface PaymentSectionProps {
  bank: BankOption;
  accountNumber: string;
  onBankChange: (bank: BankOption) => void;
  onAccountNumberChange: (account: string) => void;
  error?: string;
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
  onBankChange,
  onAccountNumberChange,
  error,
}: PaymentSectionProps) => {
  return (
    <div className="space-y-5">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-white">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-800 text-xs text-gray-400">
          3
        </span>
        Thanh toán
      </h3>

      <div>
        <label className="mb-2 block text-xs font-medium text-gray-500 uppercase">Ngân hàng nhận tiền</label>
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

      <div>
        <label className="mb-2 block text-xs font-medium text-gray-500 uppercase">Số tài khoản</label>
        <div className="relative">
          <Input
            type="text"
            placeholder="Nhập STK chính chủ"
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
      <div>
        <label className="mb-2 block text-xs font-medium text-gray-500 uppercase">Tên tài khoản</label>
        <div className="relative">
          <Input
            type="text"
            placeholder="Nhập tên tài khoản chính chủ"
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
      <div className="mt-2 rounded border border-blue-500/10 bg-blue-500/5 p-3">
        <p className="flex items-start gap-2 text-xs leading-relaxed text-blue-400">
          <Info className="mt-0.5 h-3 w-3 flex-shrink-0" />
          <span>Lưu ý: Tên chủ tài khoản ngân hàng phải trùng khớp với tên KYC trên Mezon.</span>
        </p>
      </div>
    </div>
  );
};
