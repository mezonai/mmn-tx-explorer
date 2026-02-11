'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { P2POffer, BankOption } from '../../types';
import { CheckCircle2 } from 'lucide-react';
import { APP_CONFIG } from '@/configs/app.config';
import { ConfirmPurchaseModal } from './confirm-purchase-modal';
import { formatCurrency } from '@/modules/p2p/util';
import { PaymentSection } from '../p2p-trading/create-offer-form/payment-section';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import BigNumber from 'bignumber.js';
import { NumberUtil } from '@/utils';

const paymentSchema = z.object({
  bank_info: z.object({
    bank: z.enum(['MB', 'VCB', 'TCB', 'ACB', 'TPBANK', 'VIETCOMBANK']),
    account_number: z
      .string()
      .min(1, 'Please enter the account number')
      .regex(/^\d+$/, 'Account number must contain only digits'),
    account_name: z.string().min(1, 'Please enter the account name'),
  }),
  side: z.string().optional(),
  amount: z.number().optional(),
  price_rate: z.string().optional(),
  limit: z.object({ min: z.number(), max: z.number() }).optional(),
  symbol: z.string().optional(),
});

interface BuyAmountSectionProps {
  offer: P2POffer;
  onConfirmBuy: (
    amountMZD: number,
    amountVND: number,
    bank_info?: { bank: string; account_number: string; account_name: string }
  ) => void;
  isLoading?: boolean;
  extraDisabled?: boolean;
  isSeller?: boolean;
  side?: 'BUY' | 'SELL';
  userBalance?: number;
}

const getRawValue = (val: string): number => {
  return parseFloat(val.replace(/\./g, '').replace(/,/g, '')) || 0;
};

export const BuyAmountSection = ({
  offer,
  onConfirmBuy,
  isLoading = false,
  extraDisabled = false,
  isSeller = false,
  side = 'SELL',
  userBalance = 0,
}: BuyAmountSectionProps) => {
  const [amountMZD, setAmountMZD] = useState<number>(0);
  const [displayValue, setDisplayValue] = useState<string>('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectionType, setSelectionType] = useState<'min' | 'max' | 'none'>('none');

  const isRespondingToBuyOffer = side === 'BUY';

  const {
    control,
    getValues,
    trigger,
    formState: { errors, isValid: isFormValid },
  } = useForm({
    resolver: zodResolver(paymentSchema),
    mode: 'onChange',
    defaultValues: {
      bank_info: { bank: 'MB' as BankOption, account_name: '', account_number: '' },
      side: 'BUY',
      amount: 0,
      price_rate: '0',
      limit: { min: 0, max: 0 },
      symbol: 'MZD',
    },
  });

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

  const handleConfirm = async () => {
    if (isRespondingToBuyOffer) {
      const isBankInfoValid = await trigger('bank_info');
      if (!isBankInfoValid) return;

      if (amountMZD > userBalance) {
        return;
      }
    }

    if (amountMZD >= initialMin.toNumber() && amountMZD <= effectiveMax.toNumber()) {
      setShowConfirmModal(true);
    }
  };

  const handleFinalConfirm = () => {
    const bankInfo = isRespondingToBuyOffer ? getValues('bank_info') : undefined;
    onConfirmBuy(amountMZD, amountVND, bankInfo);
    setShowConfirmModal(false);
  };

  const amountBN = new BigNumber(amountMZD);
  const isRangeValid = amountBN.isGreaterThanOrEqualTo(initialMin) && amountBN.isLessThanOrEqualTo(effectiveMax);
  const isBalanceValid = !isRespondingToBuyOffer || amountMZD <= userBalance;
  const isValidAmount =
    isRangeValid && isBalanceValid && (!isRespondingToBuyOffer || isFormValid);

  return (
    <div className={`mb-6 ${isRespondingToBuyOffer ? 'grid grid-cols-1 lg:grid-cols-2 gap-8' : 'space-y-4'}`}>
      <div className="space-y-4">
        <div>
          <label className="text-muted-foreground mb-2 block text-sm font-medium">
            {isRespondingToBuyOffer ? 'Amount to sell' : 'Amount to buy'}
          </label>
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
                {isRespondingToBuyOffer ? 'Sell Min' : 'Buy Min'}
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
                {isRespondingToBuyOffer ? 'Sell Max' : 'Buy Max'}
              </Button>
            </div>
          </div>
        </div>

        {amountMZD > 0 && (
          <div className="border-border bg-muted/50 rounded-lg border px-4 py-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-muted-foreground text-sm">
                {isRespondingToBuyOffer ? 'Amount to receive' : 'Amount to pay'}
              </span>
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
            className="w-full bg-emerald-500 hover:bg-emerald-600 inline-flex items-center justify-center rounded-lg px-5 py-6 text-base font-semibold text-white shadow-lg transition gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle2 className="h-5 w-5" />
            {isLoading ? 'Processing...' : isRespondingToBuyOffer ? 'Confirm sell' : 'Confirm purchase'}
          </Button>
        </div>

        {isRespondingToBuyOffer && amountMZD > userBalance && (
          <p className="text-center text-xs text-red-500 font-bold">
            Insufficient balance. You have {formatCurrency(userBalance)} {APP_CONFIG.CHAIN_SYMBOL}
          </p>
        )}

        {!isRangeValid && amountMZD > 0 && (
          <p className="text-center text-xs text-red-500">
            Amount must be between {initialMin.toFormat()} and {effectiveMax.toFormat()}{' '}
            {APP_CONFIG.CHAIN_SYMBOL}
          </p>
        )}
      </div>

      {isRespondingToBuyOffer && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900/50">
          <PaymentSection control={control as any} />
        </div>
      )}

      <ConfirmPurchaseModal
        open={showConfirmModal}
        onOpenChange={setShowConfirmModal}
        amountToBuy={amountMZD}
        amountToPay={amountVND}
        priceRate={offer.price_rate}
        onConfirm={handleFinalConfirm}
        isLoading={isLoading}
        actionType={isRespondingToBuyOffer ? 'SELL' : 'BUY'}
      />
    </div>
  );
};
