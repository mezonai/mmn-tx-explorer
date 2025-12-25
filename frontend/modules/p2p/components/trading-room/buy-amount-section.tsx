'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { P2POffer } from '../../types';
import { CheckCircle2 } from 'lucide-react';
import { APP_CONFIG } from '@/configs/app.config';

interface BuyAmountSectionProps {
  offer: P2POffer;
  onConfirmBuy: (amountMZD: number, amountVND: number) => void;
  isLoading?: boolean;
}

const formatCurrency = (num: number): string => {
  return new Intl.NumberFormat('vi-VN').format(num);
};

const getRawValue = (val: string): number => {
  return parseFloat(val.replace(/\./g, '').replace(/,/g, '')) || 0;
};

export const BuyAmountSection = ({ offer, onConfirmBuy, isLoading = false }: BuyAmountSectionProps) => {
  const [amountMZD, setAmountMZD] = useState<number>(0);
  const [displayValue, setDisplayValue] = useState<string>('');

  const amountVND = amountMZD > 0 && offer.price_rate > 0 ? amountMZD * offer.price_rate : 0;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = getRawValue(e.target.value);
    if (rawValue === 0) {
      setDisplayValue('');
      setAmountMZD(0);
    } else {

      const formatted = formatCurrency(rawValue);
      setDisplayValue(formatted);
      setAmountMZD(rawValue);
    }
  };

  const available = offer.amount;
  const initialMin = offer.limit.min;
  const effectiveMax = Math.min(offer.limit.max, available);

  let placeholder = `Minimum: ${formatCurrency(initialMin)} - Maximum: ${formatCurrency(effectiveMax)}`;
  let isDisabled = false;

  if (available === 0) {
    placeholder = 'Minimum: 0 - Maximum: 0';
    isDisabled = true;
  } else if (available < initialMin) {
    placeholder = 'The available amount is below the minimum requirement.';
    isDisabled = true;
  }

  const handleConfirm = () => {
    if (amountMZD >= initialMin && amountMZD <= effectiveMax) {
      onConfirmBuy(amountMZD, amountVND);
    }
  };

  const isValidAmount = amountMZD >= initialMin && amountMZD <= effectiveMax;

  return (
    <div className="mb-6 space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium text-muted-foreground">Amount to buy</label>
        <div className="relative">
          <Input
            type="text"
            placeholder={placeholder}
            value={displayValue}
            onChange={handleInputChange}
            disabled={isDisabled}
            className="bg-input/30 dark:bg-input/30 focus:border-brand-primary w-full rounded-md border-border px-3 py-2.5  font-bold text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <span className="absolute top-3.5 right-3 text-xs font-bold text-muted-foreground">{APP_CONFIG.CHAIN_SYMBOL}</span>
        </div>
        <div className="mt-1 text-xs text-muted-foreground">Available: {formatCurrency(available)} {APP_CONFIG.CHAIN_SYMBOL}</div>
      </div>


      {amountMZD > 0 && (
        <div className="rounded-lg border border-border bg-muted/50 px-4 py-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Amount to pay</span>
            <span className="text-2xl font-bold text-green-400">
              {formatCurrency(amountVND)} <span className="text-sm">VND</span>
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Rate: {offer.price_rate.toLocaleString('vi-VN')} VND/{APP_CONFIG.CHAIN_SYMBOL}</span>
            <span>≈ {formatCurrency(amountMZD)} {APP_CONFIG.CHAIN_SYMBOL}</span>
          </div>
        </div>
      )}

      <div className="mt-4 flex justify-center">
        <Button
          onClick={handleConfirm}
          disabled={!isValidAmount || isLoading}
          className="rounded-lg bg-emerald-500 px-6 py-2 font-bold text-white transition hover:bg-emerald-600"
        >
          <CheckCircle2 className="h-5 w-5" />
          {isLoading ? 'Processing...' : 'Confirm purchase'}
        </Button>
      </div>

      {!isValidAmount && amountMZD > 0 && (
        <p className="text-center text-xs text-red-500">
          Amount must be between {formatCurrency(initialMin)} and{' '}
          {formatCurrency(effectiveMax)} {APP_CONFIG.CHAIN_SYMBOL}
        </p>
      )}
    </div>
  );
};