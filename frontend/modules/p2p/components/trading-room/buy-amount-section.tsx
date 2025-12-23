'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { P2POffer } from '../../types';
import { CheckCircle2 } from 'lucide-react';

interface BuyAmountSectionProps {
  offer: P2POffer;
  onConfirmBuy: (amountMZD: number, amountVND: number) => void;
  isLoading?: boolean;
}

// Format number with locale separators
const formatCurrency = (num: number): string => {
  return new Intl.NumberFormat('vi-VN').format(num);
};

// Extract numeric value from a formatted string
const getRawValue = (val: string): number => {
  return parseFloat(val.replace(/\./g, '').replace(/,/g, '')) || 0;
};

export const BuyAmountSection = ({ offer, onConfirmBuy, isLoading = false }: BuyAmountSectionProps) => {
  const [amountMZD, setAmountMZD] = useState<number>(0);
  const [displayValue, setDisplayValue] = useState<string>('');

  // Calculate VND based on the exchange rate
  const amountVND = amountMZD > 0 && offer.price_rate > 0 ? amountMZD * offer.price_rate : 0;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = getRawValue(e.target.value);
    if (rawValue === 0) {
      setDisplayValue('');
      setAmountMZD(0);
    } else {
      // Allow free input without immediate validation
      const formatted = formatCurrency(rawValue);
      setDisplayValue(formatted);
      setAmountMZD(rawValue);
    }
  };

  // Calculate available amount (remaining amount in offer)
  const available = offer.amount; // Use amount as available for now

  const setQuickAmount = (value: number) => {
    const validatedValue = Math.max(offer.limit.min, Math.min(value, Math.min(offer.limit.max, available)));
    setDisplayValue(formatCurrency(validatedValue));
    setAmountMZD(validatedValue);
  };

  const handleConfirm = () => {
    if (amountMZD >= offer.limit.min && amountMZD <= Math.min(offer.limit.max, available)) {
      onConfirmBuy(amountMZD, amountVND);
    }
  };

  const isValidAmount = amountMZD >= offer.limit.min && amountMZD <= Math.min(offer.limit.max, available);

  return (
    <div className="mb-6 space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-400">MZD amount to buy</label>
        <div className="relative">
          <Input
            type="text"
            placeholder={`Minimum: ${formatCurrency(offer.limit.min)} - Maximum: ${formatCurrency(
              Math.min(offer.limit.max, available)
            )}`}
            value={displayValue}
            onChange={handleInputChange}
            className="bg-input/30 dark:bg-input/30 focus:border-brand-primary w-full rounded-md border-gray-700 px-3 py-2.5 text-lg font-bold text-white placeholder-gray-600 focus:outline-none"
          />
          <span className="absolute top-3.5 right-3 text-xs font-bold text-gray-500">MZD</span>
        </div>
        <div className="mt-1 text-xs text-gray-500">Available: {formatCurrency(available)} MZD</div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setQuickAmount(offer.limit.min)}
          className="h-auto rounded border-gray-700 bg-gray-800 py-1.5 text-xs text-gray-300 hover:bg-gray-700 hover:text-gray-300"
        >
          Min
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setQuickAmount(Math.floor(available / 4))}
          className="h-auto rounded border-gray-700 bg-gray-800 py-1.5 text-xs text-gray-300 hover:bg-gray-700 hover:text-gray-300"
        >
          25%
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setQuickAmount(Math.floor(available / 2))}
          className="h-auto rounded border-gray-700 bg-gray-800 py-1.5 text-xs text-gray-300 hover:bg-gray-700 hover:text-gray-300"
        >
          50%
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setQuickAmount(Math.min(available, offer.limit.max))}
          className="h-auto rounded border-gray-700 bg-gray-800 py-1.5 text-xs text-gray-300 hover:bg-gray-700 hover:text-gray-300"
        >
          Max
        </Button>
      </div>

      {amountMZD > 0 && (
        <div className="rounded-lg border border-gray-700/50 bg-gray-800/50 px-4 py-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-gray-400">Amount to pay</span>
            <span className="text-2xl font-bold text-green-400">
              {formatCurrency(amountVND)} <span className="text-sm">VND</span>
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Rate: {offer.price_rate.toLocaleString('vi-VN')} VND/MZD</span>
            <span>≈ {formatCurrency(amountMZD)} MZD</span>
          </div>
        </div>
      )}

      <div className="mt-4 flex justify-center">
        <Button
          onClick={handleConfirm}
          disabled={!isValidAmount || isLoading}
          className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-8 py-3 text-base font-bold text-white shadow-lg shadow-emerald-900/20 transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <CheckCircle2 className="h-5 w-5" />
          {isLoading ? 'Processing...' : 'Confirm purchase'}
        </Button>
      </div>

      {!isValidAmount && amountMZD > 0 && (
        <p className="text-center text-xs text-red-500">
          Amount must be between {formatCurrency(offer.limit.min)} and{' '}
          {formatCurrency(Math.min(offer.limit.max, available))} MZD
        </p>
      )}
    </div>
  );
};
