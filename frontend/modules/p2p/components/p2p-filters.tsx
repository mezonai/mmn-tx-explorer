'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TradeType, P2PFilters } from '../types/p2p.types';
import { Plus, ChevronDown } from 'lucide-react';

interface P2PFiltersProps {
  filters: P2PFilters;
  onFiltersChange: (filters: P2PFilters) => void;
  onNewOfferClick?: () => void;
}

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
        <div className="bg-card dark:bg-card flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-1 dark:border-gray-700">
          <span className="text-brand-primary font-bold">MZD</span>
          <ChevronDown className="h-3 w-3 text-gray-400" />
        </div>
      </div>

      {/* Filters Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {/* Amount Input */}
        <div className="relative">
          <span className="absolute top-3 left-3 text-sm text-gray-400">MZD</span>
          <Input
            type="number"
            placeholder="Nhập số MZD muốn mua (VD: 1000)"
            value={localAmount}
            onChange={(e) => handleAmountChange(e.target.value)}
            className="bg-card focus:border-brand-primary w-full border-gray-300 py-2.5 pr-4 pl-12 dark:border-gray-700"
          />
        </div>


        {/* New Offer Button */}
        <Button
          onClick={onNewOfferClick}
          className="h-full w-full bg-[#3c8d35] py-2.5 text-xl font-bold text-white shadow-lg transition hover:bg-[#327a2c]"
        >
          <Plus className="mr-2 h-5 w-5" />
          New offer
        </Button>
      </div>
    </div>
  );
};
