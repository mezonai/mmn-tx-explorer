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
      // Validate min/max
      const validatedValue = Math.max(
        offer.limit.min,
        Math.min(rawValue, Math.min(offer.limit.max, offer.available))
      );
      const formatted = formatCurrency(validatedValue);
      setDisplayValue(formatted);
      setAmountMZD(validatedValue);
    }
  };

  const setQuickAmount = (value: number) => {
    const validatedValue = Math.max(
      offer.limit.min,
      Math.min(value, Math.min(offer.limit.max, offer.available))
    );
    setDisplayValue(formatCurrency(validatedValue));
    setAmountMZD(validatedValue);
  };

  const handleConfirm = () => {
    if (amountMZD >= offer.limit.min && amountMZD <= Math.min(offer.limit.max, offer.available)) {
      // Console log đầy đủ thông tin khi xác nhận mua
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🛒 CONFIRM BUY - Full Information');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📦 Offer Information:', {
        offerId: offer.id,
        seller: {
          id: offer.advertiser.id,
          username: offer.advertiser.username,
          isVerified: offer.advertiser.isVerified,
          isClanMember: offer.advertiser.isClanMember,
          totalOrders: offer.advertiser.totalOrders,
          completionRate: offer.advertiser.completionRate,
        },
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
        paymentMethods: offer.paymentMethods,
        isClanOffer: offer.isClanOffer || false,
      });
      console.log('💰 Purchase Details:', {
        amountMZD: amountMZD,
        amountMZDFormatted: formatCurrency(amountMZD),
        amountVND: amountVND,
        amountVNDFormatted: formatCurrency(amountVND),
        exchangeRate: offer.exchangeRate,
        calculation: `${formatCurrency(amountMZD)} MZD × ${offer.exchangeRate.toLocaleString('vi-VN')} = ${formatCurrency(amountVND)} VND`,
      });
      console.log('✅ Validation:', {
        isValid: amountMZD >= offer.limit.min && amountMZD <= Math.min(offer.limit.max, offer.available),
        minCheck: `${amountMZD} >= ${offer.limit.min} = ${amountMZD >= offer.limit.min}`,
        maxCheck: `${amountMZD} <= ${Math.min(offer.limit.max, offer.available)} = ${amountMZD <= Math.min(offer.limit.max, offer.available)}`,
        availableCheck: `${amountMZD} <= ${offer.available} = ${amountMZD <= offer.available}`,
      });
      console.log('📊 Summary:', {
        'Người bán': offer.advertiser.username,
        'Số MZD mua': `${formatCurrency(amountMZD)} MZD`,
        'Số VND thanh toán': `${formatCurrency(amountVND)} VND`,
        'Tỉ giá': `${offer.exchangeRate.toLocaleString('vi-VN')} VND/MZD`,
        'Giới hạn giao dịch': `${formatCurrency(offer.limit.min)} - ${formatCurrency(offer.limit.max)} MZD`,
        'MZD còn lại sau giao dịch': `${formatCurrency(offer.available - amountMZD)} MZD`,
      });
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      onConfirmBuy(amountMZD, amountVND);
    }
  };

  const isValidAmount =
    amountMZD >= offer.limit.min && amountMZD <= Math.min(offer.limit.max, offer.available);

  return (
    <div className="space-y-4 mb-6">
      <div>
        <label className="block text-sm text-gray-400 mb-2 font-medium">
          Số lượng MZD muốn mua
        </label>
        <div className="relative">
          <Input
            type="text"
            placeholder={`Tối thiểu: ${formatCurrency(offer.limit.min)} - Tối đa: ${formatCurrency(
              Math.min(offer.limit.max, offer.available)
            )}`}
            value={displayValue}
            onChange={handleInputChange}
            className="w-full bg-input/30 dark:bg-input/30 border-gray-700 rounded-md px-3 py-2.5 text-white focus:border-brand-primary focus:outline-none font-bold text-lg placeholder-gray-600"
          />
          <span className="absolute right-3 top-3.5 text-gray-500 text-xs font-bold">MZD</span>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Khả dụng: {formatCurrency(offer.available)} MZD
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <button
          onClick={() => setQuickAmount(offer.limit.min)}
          className="py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded text-xs text-gray-300 transition"
        >
          Min
        </button>
        <button
          onClick={() => setQuickAmount(Math.floor(offer.available / 4))}
          className="py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded text-xs text-gray-300 transition"
        >
          25%
        </button>
        <button
          onClick={() => setQuickAmount(Math.floor(offer.available / 2))}
          className="py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded text-xs text-gray-300 transition"
        >
          50%
        </button>
        <button
          onClick={() => setQuickAmount(Math.min(offer.available, offer.limit.max))}
          className="py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded text-xs text-gray-300 transition"
        >
          Max
        </button>
      </div>

      {amountMZD > 0 && (
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-400">Số tiền cần thanh toán</span>
            <span className="text-2xl font-bold text-green-400">
              {formatCurrency(amountVND)} <span className="text-sm">VND</span>
            </span>
          </div>
          <div className="flex justify-between items-center text-xs text-gray-500">
            <span>Tỉ giá: {offer.exchangeRate.toLocaleString('vi-VN')} VND/MZD</span>
            <span>≈ {formatCurrency(amountMZD)} MZD</span>
          </div>
        </div>
      )}

      <Button
        onClick={handleConfirm}
        disabled={!isValidAmount || isLoading}
        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-lg py-4 rounded-xl shadow-lg shadow-emerald-900/20 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <CheckCircle2 className="h-5 w-5" />
        {isLoading ? 'Đang xử lý...' : 'Xác nhận mua'}
      </Button>

      {!isValidAmount && amountMZD > 0 && (
        <p className="text-xs text-red-500 text-center">
          Số lượng phải từ {formatCurrency(offer.limit.min)} đến{' '}
          {formatCurrency(Math.min(offer.limit.max, offer.available))} MZD
        </p>
      )}
    </div>
  );
};

