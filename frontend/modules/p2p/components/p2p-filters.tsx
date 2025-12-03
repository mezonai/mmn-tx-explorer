'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { TradeType, PaymentMethod, P2PFilters } from '../types/p2p.types';
import { Plus, ChevronDown, Shield } from 'lucide-react';

interface P2PFiltersProps {
  filters: P2PFilters;
  onFiltersChange: (filters: P2PFilters) => void;
  onNewOfferClick?: () => void;
}

const paymentMethodOptions: { value: PaymentMethod; label: string }[] = [
  { value: 'ALL', label: 'Tất cả thanh toán' },
  { value: 'BANK_TRANSFER', label: 'Chuyển khoản NH' },
  { value: 'MOMO', label: 'Momo' },
  { value: 'TPBANK', label: 'TPBank' },
  { value: 'VIETCOMBANK', label: 'Vietcombank' },
];

export const P2PFiltersComponent = ({ filters, onFiltersChange, onNewOfferClick }: P2PFiltersProps) => {
  const [localAmount, setLocalAmount] = useState<string>(filters.amount?.toString() || '');

  const handleTradeTypeChange = (type: TradeType) => {
    onFiltersChange({ ...filters, tradeType: type });
  };

  const handleAmountChange = (value: string) => {
    setLocalAmount(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0) {
      onFiltersChange({ ...filters, amount: numValue });
    } else if (value === '') {
      onFiltersChange({ ...filters, amount: undefined });
    }
  };

  const handlePaymentMethodChange = (value: PaymentMethod) => {
    onFiltersChange({ ...filters, paymentMethod: value });
  };

  const handleFriendsOnlyChange = (checked: boolean) => {
    onFiltersChange({ ...filters, friendsOnly: checked });
  };

  return (
    <div className="space-y-6">
      {/* Trade Type Toggle and Currency Selector */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => handleTradeTypeChange('BUY')}
            className={`border-b-2 pb-1 text-lg font-bold transition ${
              filters.tradeType === 'BUY'
                ? 'border-emerald-500 text-emerald-500 dark:text-emerald-400'
                : 'border-transparent text-gray-500 hover:text-emerald-500 dark:text-gray-400 dark:hover:text-emerald-400'
            }`}
          >
            MUA
          </button>
          <button
            onClick={() => handleTradeTypeChange('SELL')}
            className={`border-b-2 pb-1 text-lg font-bold transition ${
              filters.tradeType === 'SELL'
                ? 'border-rose-500 text-rose-500 dark:text-rose-400'
                : 'border-transparent text-gray-500 hover:text-rose-500 dark:text-gray-400 dark:hover:text-rose-400'
            }`}
          >
            BÁN
          </button>
        </div>

        {/* Currency Selector */}
        <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-card px-3 py-1 dark:border-gray-700 dark:bg-card">
          <span className="font-bold text-brand-primary">MZD</span>
          <ChevronDown className="h-3 w-3 text-gray-400" />
        </div>
      </div>

      {/* Filters Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {/* Amount Input */}
        <div className="relative">
          <span className="absolute left-3 top-3 text-sm text-gray-400">MZD</span>
          <Input
            type="number"
            placeholder="Nhập số MZD muốn mua (VD: 1000)"
            value={localAmount}
            onChange={(e) => handleAmountChange(e.target.value)}
            className="w-full bg-card border-gray-300 py-2.5 pl-12 pr-4 focus:border-brand-primary transition dark:border-gray-700"
          />
        </div>

        {/* Payment Method Select 
        <Select value={filters.paymentMethod} onValueChange={handlePaymentMethodChange}>
          <SelectTrigger className="w-full bg-card border-gray-300 py-2.5 focus:border-brand-primary transition dark:border-gray-700">
            <SelectValue placeholder="Tất cả thanh toán" />
          </SelectTrigger>
          <SelectContent>
            {paymentMethodOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>*/}

        {/* Friends/Clan Filter 
        <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-card px-4 py-2.5 transition hover:border-brand-primary dark:border-gray-700 dark:bg-card">
          <input
            type="checkbox"
            id="clanFilter"
            checked={filters.friendsOnly}
            onChange={(e) => handleFriendsOnlyChange(e.target.checked)}
            className="h-4 w-4 accent-brand-primary"
          />
          <label htmlFor="clanFilter" className="cursor-pointer text-sm select-none truncate text-gray-700 dark:text-gray-300">
            Chỉ hiện Bạn bè / Clan
          </label>
          <Shield className="h-4 w-4 text-yellow-500 ml-1" />
        </div>*/}

        {/* New Offer Button */}
        <Button
          onClick={onNewOfferClick}
          className="h-full w-full bg-[#3c8d35] hover:bg-[#327a2c] text-white font-bold text-xl py-2.5 shadow-lg transition"
        >
          <Plus className="h-5 w-5 mr-2" />
          New offer
        </Button>
      </div>
    </div>
  );
};

