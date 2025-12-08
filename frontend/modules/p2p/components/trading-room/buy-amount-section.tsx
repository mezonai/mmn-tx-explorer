'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { P2POffer } from '../../types/p2p.types';
import { CheckCircle2 } from 'lucide-react';

interface BuyAmountSectionProps {
  offer: P2POffer;
  onConfirmBuy: (amountMZD: number, amountVND: number) => void;
  isLoading?: boolean;
}

// Format số với dấu phẩy
const formatCurrency = (num: number): string => {
  return new Intl.NumberFormat('vi-VN').format(num);
};

// Lấy giá trị số từ string có dấu phẩy
const getRawValue = (val: string): number => {
  return parseFloat(val.replace(/\./g, '').replace(/,/g, '')) || 0;
};

export const BuyAmountSection = ({ offer, onConfirmBuy, isLoading = false }: BuyAmountSectionProps) => {
  const [amountMZD, setAmountMZD] = useState<number>(0);
  const [displayValue, setDisplayValue] = useState<string>('');

  // Tính VND dựa vào tỉ giá
  const amountVND = amountMZD > 0 && offer.exchangeRate > 0 ? amountMZD * offer.exchangeRate : 0;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = getRawValue(e.target.value);
    if (rawValue === 0) {
      setDisplayValue('');
      setAmountMZD(0);
    } else {
      // Cho phép nhập tự do, không validate ngay
      const formatted = formatCurrency(rawValue);
      setDisplayValue(formatted);
      setAmountMZD(rawValue);
    }
  };

  const setQuickAmount = (value: number) => {
    const validatedValue = Math.max(offer.limit.min, Math.min(value, Math.min(offer.limit.max, offer.available)));
    setDisplayValue(formatCurrency(validatedValue));
    setAmountMZD(validatedValue);
  };

  const handleConfirm = () => {
    if (amountMZD >= offer.limit.min && amountMZD <= Math.min(offer.limit.max, offer.available)) {
      // Console log đầy đủ thông tin khi xác nhận mua
      console.log('📦 Offer Information:', {
        offerId: offer.offerId,
        sellerWalletAddress: offer.sellerWalletAddress,
        totalMZD: offer.totalMZD,
        totalMZDFormatted: formatCurrency(offer.totalMZD),
        available: offer.available,
        availableFormatted: formatCurrency(offer.available),
        limit: {
          min: offer.limit.min,
          minFormatted: formatCurrency(offer.limit.min),
          max: offer.limit.max,
          maxFormatted: formatCurrency(offer.limit.max),
          range: `${formatCurrency(offer.limit.min)} - ${formatCurrency(offer.limit.max)} MZD`,
        },
        exchangeRate: offer.exchangeRate,
        exchangeRateDisplay: `1 MZD = ${offer.exchangeRate.toLocaleString('vi-VN')} VND`,
        bankInfo: offer.bankInfo,
      });
      console.log('💰 Purchase Details:', {
        amountMZD: amountMZD,
        amountMZDFormatted: formatCurrency(amountMZD),
        amountVND: amountVND,
        amountVNDFormatted: formatCurrency(amountVND),
        exchangeRate: offer.exchangeRate,
        calculation: `${formatCurrency(amountMZD)} MZD × ${offer.exchangeRate.toLocaleString('vi-VN')} = ${formatCurrency(amountVND)} VND`,
      });

      onConfirmBuy(amountMZD, amountVND);
    }
  };

  const isValidAmount = amountMZD >= offer.limit.min && amountMZD <= Math.min(offer.limit.max, offer.available);

  return (
    <div className="mb-6 space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-400">Số lượng MZD muốn mua</label>
        <div className="relative">
          <Input
            type="text"
            placeholder={`Tối thiểu: ${formatCurrency(offer.limit.min)} - Tối đa: ${formatCurrency(
              Math.min(offer.limit.max, offer.available)
            )}`}
            value={displayValue}
            onChange={handleInputChange}
            className="bg-input/30 dark:bg-input/30 focus:border-brand-primary w-full rounded-md border-gray-700 px-3 py-2.5 text-lg font-bold text-white placeholder-gray-600 focus:outline-none"
          />
          <span className="absolute top-3.5 right-3 text-xs font-bold text-gray-500">MZD</span>
        </div>
        <div className="mt-1 text-xs text-gray-500">Khả dụng: {formatCurrency(offer.available)} MZD</div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <button
          onClick={() => setQuickAmount(offer.limit.min)}
          className="rounded border border-gray-700 bg-gray-800 py-1.5 text-xs text-gray-300 transition hover:bg-gray-700"
        >
          Min
        </button>
        <button
          onClick={() => setQuickAmount(Math.floor(offer.available / 4))}
          className="rounded border border-gray-700 bg-gray-800 py-1.5 text-xs text-gray-300 transition hover:bg-gray-700"
        >
          25%
        </button>
        <button
          onClick={() => setQuickAmount(Math.floor(offer.available / 2))}
          className="rounded border border-gray-700 bg-gray-800 py-1.5 text-xs text-gray-300 transition hover:bg-gray-700"
        >
          50%
        </button>
        <button
          onClick={() => setQuickAmount(Math.min(offer.available, offer.limit.max))}
          className="rounded border border-gray-700 bg-gray-800 py-1.5 text-xs text-gray-300 transition hover:bg-gray-700"
        >
          Max
        </button>
      </div>

      {amountMZD > 0 && (
        <div className="rounded-lg border border-gray-700/50 bg-gray-800/50 px-4 py-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-gray-400">Số tiền cần thanh toán</span>
            <span className="text-2xl font-bold text-green-400">
              {formatCurrency(amountVND)} <span className="text-sm">VND</span>
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Tỉ giá: {offer.exchangeRate.toLocaleString('vi-VN')} VND/MZD</span>
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
          {isLoading ? 'Đang xử lý...' : 'Xác nhận mua'}
        </Button>
      </div>

      {!isValidAmount && amountMZD > 0 && (
        <p className="text-center text-xs text-red-500">
          Số lượng phải từ {formatCurrency(Number(offer.limit.min))} đến{' '}
          {formatCurrency(Number(Math.min(Number(offer.limit.max), Number(offer.available))))} MZD
        </p>
      )}
    </div>
  );
};
