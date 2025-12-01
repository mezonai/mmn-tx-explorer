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
      <h3 className="text-white font-bold text-sm flex items-center gap-2 mb-3">
        <span className="bg-gray-800 w-5 h-5 rounded-full flex items-center justify-center text-xs text-gray-400">
          3
        </span>
        Thanh toán
      </h3>

      <div>
        <label className="block text-xs text-gray-500 mb-2 font-medium uppercase">
          Ngân hàng nhận tiền
        </label>
        <Select value={bank} onValueChange={(value) => onBankChange(value as BankOption)}>
          <SelectTrigger className="w-full bg-input/30 dark:bg-input/30 border-gray-700 rounded-md px-3 py-2.5 text-sm text-white focus:border-brand-primary focus:outline-none cursor-pointer">
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
        <label className="block text-xs text-gray-500 mb-2 font-medium uppercase">Số tài khoản</label>
        <div className="relative">
          <Input
            type="text"
            placeholder="Nhập STK chính chủ"
            value={accountNumber}
            onChange={(e) => onAccountNumberChange(e.target.value)}
            className={`w-full bg-input/30 dark:bg-input/30 border-gray-700 rounded-md px-3 py-2.5 text-sm text-white focus:border-brand-primary focus:outline-none ${
              error ? 'border-red-500' : ''
            }`}
          />
          <div className="absolute right-3 top-3 text-gray-500">
            <CreditCard className="h-3 w-3" />
          </div>
        </div>
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>

      <div className="bg-blue-500/5 p-3 rounded border border-blue-500/10 mt-2">
        <p className="text-xs text-blue-400 leading-relaxed flex items-start gap-2">
          <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
          <span>
            Lưu ý: Tên chủ tài khoản ngân hàng phải trùng khớp với tên KYC trên Mezon.
          </span>
        </p>
      </div>
    </div>
  );
};




