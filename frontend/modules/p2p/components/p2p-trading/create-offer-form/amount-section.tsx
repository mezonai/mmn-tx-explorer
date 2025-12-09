'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';

interface AmountSectionProps {
  amountMZD: number;
  onAmountChange: (amount: number) => void;
  exchangeRate: number;
  error?: string;
}

// Format number with commas
const formatCurrency = (num: number): string => {
  return new Intl.NumberFormat('en-US').format(num);
};

const getRawValue = (val: string): number => {
  return parseFloat(val.replace(/,/g, '')) || 0;
};

export const AmountSection = ({ amountMZD, onAmountChange, exchangeRate, error }: AmountSectionProps) => {
  const [displayValue, setDisplayValue] = useState<string>('');

  useEffect(() => {
    if (amountMZD > 0) {
      setDisplayValue(formatCurrency(amountMZD));
    } else {
      setDisplayValue('');
    }
  }, [amountMZD]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = getRawValue(e.target.value);
    if (rawValue === 0) {
      setDisplayValue('');
      onAmountChange(0);
    } else {
      const formatted = formatCurrency(rawValue);
      setDisplayValue(formatted);
      onAmountChange(rawValue);
    }
  };

  const setQuickAmount = (value: number) => {
    setDisplayValue(formatCurrency(value));
    onAmountChange(value);
    const input = document.getElementById('amountInput');
    if (input) {
      input.classList.add('bg-gray-700');
      setTimeout(() => input.classList.remove('bg-gray-700'), 200);
    }
  };

  const totalVND = exchangeRate > 0 ? amountMZD * exchangeRate : 0;

  return (
    <div className="space-y-5 border-b border-gray-800 pb-4 lg:border-r lg:border-b-0 lg:pr-8 lg:pb-0">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-white">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-800 text-xs text-gray-400">
          2
        </span>
        Trading Volume
      </h3>

      <div>
        <label className="mb-2 block text-xs font-medium text-gray-500 uppercase">Amount to Sell (MZD)</label>
        <div className="group relative">
          <Input
            id="amountInput"
            type="text"
            placeholder="Ex: 5,000,000"
            value={displayValue}
            onChange={handleInputChange}
            className={`bg-input/30 dark:bg-input/30 focus:border-brand-primary w-full rounded-md border-gray-700 px-3 py-2.5 text-lg font-bold text-white placeholder-gray-600 transition-colors group-hover:border-gray-600 focus:outline-none ${
              error ? 'border-red-500' : ''
            }`}
          />
          <span className="absolute top-3.5 right-3 text-xs font-bold text-gray-500">MZD</span>
        </div>
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}

        <div className="mt-3 grid grid-cols-4 gap-2">
          <button
            onClick={() => setQuickAmount(100000)}
            className="rounded border border-gray-700 bg-gray-800 py-1.5 text-xs text-gray-300 transition hover:bg-gray-700"
          >
            100k
          </button>
          <button
            onClick={() => setQuickAmount(500000)}
            className="rounded border border-gray-700 bg-gray-800 py-1.5 text-xs text-gray-300 transition hover:bg-gray-700"
          >
            500k
          </button>
          <button
            onClick={() => setQuickAmount(1000000)}
            className="rounded border border-gray-700 bg-gray-800 py-1.5 text-xs text-gray-300 transition hover:bg-gray-700"
          >
            1M
          </button>
          <button
            onClick={() => setQuickAmount(5000000)}
            className="rounded border border-gray-700 bg-gray-800 py-1.5 text-xs text-gray-300 transition hover:bg-gray-700"
          >
            5M
          </button>
        </div>
      </div>

      <div className="pt-2">
        <label className="mb-2 block text-xs font-medium text-gray-500 uppercase">Total Received (VND)</label>
        <div className="flex h-24 flex-col items-center justify-center rounded-lg border border-gray-700/50 bg-gray-800/50 px-4 py-4">
          <span className="text-2xl font-bold text-green-400">{formatCurrency(totalVND)}</span>
          <span className="mt-1 text-xs font-bold text-gray-500">VND</span>
        </div>
      </div>
    </div>
  );
};
