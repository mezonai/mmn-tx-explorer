'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { P2POffer } from '../../types';
import { CheckCircle2 } from 'lucide-react';
import { APP_CONFIG } from '@/configs/app.config';
import { ConfirmPurchaseModal } from './confirm-purchase-modal';
import { formatCurrency } from '@/modules/p2p/util';
import BigNumber from 'bignumber.js';
import { NumberUtil } from '@/utils';

interface BuyAmountSectionProps {
  offer: P2POffer;
  onConfirmBuy: (amountMZD: number, amountVND: number) => void;
  isLoading?: boolean;
  extraDisabled?: boolean;
  isSeller?: boolean;
}

const getRawValue = (val: string): number => {
  return parseFloat(val.replace(/\./g, '').replace(/,/g, '')) || 0;
};

export const BuyAmountSection = ({ offer, onConfirmBuy, isLoading = false, extraDisabled = false, isSeller = false }: BuyAmountSectionProps) => {
  const [amountMZD, setAmountMZD] = useState<number>(0);
  const [displayValue, setDisplayValue] = useState<string>('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectionType, setSelectionType] = useState<'min' | 'max' | 'none'>('none');

  const amountVND = amountMZD > 0 && offer.price_rate > 0 ? amountMZD * offer.price_rate : 0;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = getRawValue(e.target.value);
    setSelectionType('none');
    if (rawValue === 0) {
      setDisplayValue('');
      setAmountMZD(0);
    } else {
      const formatted = formatCurrency(rawValue);
      setDisplayValue(formatted);
      setAmountMZD(rawValue);
    }
  };

  const available = NumberUtil.scaleDownBigNumber(new BigNumber(offer.amount));
  const initialMin = NumberUtil.scaleDownBigNumber(new BigNumber(offer.limit.min));
  const limitMax = NumberUtil.scaleDownBigNumber(new BigNumber(offer.limit.max));
  const effectiveMax = BigNumber.min(limitMax, available);

  let placeholder = `Minimum: ${initialMin.toFormat()} - Maximum: ${effectiveMax.toFormat()}`;
  let isDisabled = false;

  if (isSeller) {
    isDisabled = true;
  } else if (available.isZero()) {
    placeholder = 'Minimum: 0 - Maximum: 0';
    isDisabled = true;
  } else if (available.isLessThan(initialMin)) {
    placeholder = 'The available amount is below the minimum requirement.';
    isDisabled = true;
  }

  const handleConfirm = () => {
    if (amountMZD >= initialMin.toNumber() && amountMZD <= effectiveMax.toNumber()) {
      setShowConfirmModal(true);
    }
  };

  const handleFinalConfirm = () => {
    onConfirmBuy(amountMZD, amountVND);
    setShowConfirmModal(false);
  };

  const isValidAmount = amountMZD >= initialMin.toNumber() && amountMZD <= effectiveMax.toNumber();

  return (
    <div className="mb-6 space-y-4">
      <div>
        <label className="text-muted-foreground mb-2 block text-sm font-medium">Amount to buy</label>
        <div className="relative">
          <Input
            type="text"
            placeholder={placeholder}
            value={displayValue}
            onChange={handleInputChange}
            disabled={isDisabled}
            className="bg-input/30 dark:bg-input/30 focus:border-brand-primary border-border text-foreground placeholder:text-muted-foreground w-full rounded-md px-3 py-2.5 font-bold focus:outline-none"
          />
          <span className="text-muted-foreground absolute top-3.5 right-3 text-xs font-bold">
            {APP_CONFIG.CHAIN_SYMBOL}
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <div>Available: {available.toFormat()} {APP_CONFIG.CHAIN_SYMBOL}</div>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                setAmountMZD(initialMin.toNumber());
                setDisplayValue(initialMin.toFormat());
                setSelectionType('min');
              }}
              disabled={isDisabled}
              className={`h-[30px] rounded border text-[10px] font-bold uppercase tracking-wider transition-all disabled:cursor-not-allowed disabled:opacity-30 ${selectionType === 'min'
                ? 'border-brand-primary/50 bg-brand-primary/10 text-brand-primary'
                : 'border-border bg-muted/30 text-muted-foreground hover:border-brand-primary/50 hover:bg-brand-primary/10 hover:text-brand-primary'
                }`}
            >
              Buy Min
            </Button>
            <Button
              onClick={() => {
                setAmountMZD(effectiveMax.toNumber());
                setDisplayValue(effectiveMax.toFormat());
                setSelectionType('max');
              }}
              disabled={isDisabled}
              className={`h-[30px] rounded border text-[10px] font-bold uppercase tracking-wider transition-all disabled:cursor-not-allowed disabled:opacity-30 ${selectionType === 'max'
                ? 'border-brand-primary/50 bg-brand-primary/10 text-brand-primary'
                : 'border-border bg-muted/30 text-muted-foreground hover:border-brand-primary/50 hover:bg-brand-primary/10 hover:text-brand-primary'
                }`}
            >
              Buy Max
            </Button>
          </div>
        </div>
      </div>

      {amountMZD > 0 && (
        <div className="border-border bg-muted/50 rounded-lg border px-4 py-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-muted-foreground text-sm">Amount to pay</span>
            <span className="text-2xl font-bold text-green-400">
              {formatCurrency(amountVND)} <span className="text-sm">VND</span>
            </span>
          </div>
          <div className="text-muted-foreground flex items-center justify-between text-xs">
            <span>
              Rate: {formatCurrency(offer.price_rate)} VND/{APP_CONFIG.CHAIN_SYMBOL}
            </span>
            <span>
              ≈ {formatCurrency(amountMZD)} {APP_CONFIG.CHAIN_SYMBOL}
            </span>
          </div>
        </div>
      )}

      <div className="mt-4 flex justify-center">
        <Button
          onClick={handleConfirm}
          disabled={!isValidAmount || isLoading}
          className="w-full bg-emerald-500 hover:bg-emerald-600 inline-flex items-center justify-center rounded-lg px-5 py-6 text-base font-semibold text-white shadow-lg transition gap-2"
        >
          <CheckCircle2 className="h-5 w-5" />
          {isLoading ? 'Processing...' : 'Confirm purchase'}
        </Button>
      </div>

      {!isValidAmount && amountMZD > 0 && (
        <p className="text-center text-xs text-red-500">
          Amount must be between {initialMin.toFormat()} and {effectiveMax.toFormat()}{' '}
          {APP_CONFIG.CHAIN_SYMBOL}
        </p>
      )}

      <ConfirmPurchaseModal
        open={showConfirmModal}
        onOpenChange={setShowConfirmModal}
        amountToBuy={amountMZD}
        amountToPay={amountVND}
        priceRate={offer.price_rate}
        onConfirm={handleFinalConfirm}
        isLoading={isLoading}
      />
    </div>
  );
};
