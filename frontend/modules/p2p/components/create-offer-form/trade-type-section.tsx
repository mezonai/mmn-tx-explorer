'use client';

import { useState, useEffect } from 'react';
import { Lock } from 'lucide-react';

type TradeType = 'BUY' | 'SELL';

interface TradeTypeSectionProps {
  tradeType: TradeType;
  onTradeTypeChange: (type: TradeType) => void;
  exchangeRate: number;
  onExchangeRateChange: (rate: number) => void;
  limit: {
    min: number;
    max: number;
  };
  onLimitChange: (limit: { min: number; max: number }) => void;
  amountMZD: number;
  limitErrors?: {
    min?: string;
    max?: string;
  };
}

const formatCurrency = (num: number): string => {
  return new Intl.NumberFormat('vi-VN').format(num);
};

const getRawValue = (val: string): number => {
  return parseFloat(val.replace(/\./g, '').replace(/,/g, '')) || 0;
};

export const TradeTypeSection = ({
  tradeType,
  onTradeTypeChange,
  exchangeRate,
  onExchangeRateChange,
  limit,
  onLimitChange,
  amountMZD,
  limitErrors,
}: TradeTypeSectionProps) => {
  const [minDisplay, setMinDisplay] = useState<string>('');
  const [maxDisplay, setMaxDisplay] = useState<string>('');
  const [rateDisplay, setRateDisplay] = useState<string>('');

  useEffect(() => {
    if (limit.min > 0) {
      setMinDisplay(formatCurrency(limit.min));
    } else {
      setMinDisplay('');
    }
  }, [limit.min]);

  useEffect(() => {
    if (limit.max > 0) {
      setMaxDisplay(formatCurrency(limit.max));
    } else {
      setMaxDisplay('');
    }
  }, [limit.max]);

  useEffect(() => {
    if (exchangeRate > 0) {
      setRateDisplay(exchangeRate.toString());
    } else {
      setRateDisplay('');
    }
  }, [exchangeRate]);

  const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Cho phép nhập các ký tự: số, dấu chấm, và chuỗi rỗng
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setRateDisplay(value);
      
      // Chỉ update giá trị thực khi có số hợp lệ
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && numValue >= 0) {
        onExchangeRateChange(numValue);
      } else if (value === '') {
        onExchangeRateChange(0);
      }
    }
  };

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = getRawValue(e.target.value);
    if (rawValue === 0) {
      setMinDisplay('');
      onLimitChange({ ...limit, min: 0 });
    } else {
      const validatedValue = Math.min(rawValue, limit.max || amountMZD || Infinity);
      setMinDisplay(formatCurrency(validatedValue));
      onLimitChange({ ...limit, min: validatedValue });
    }
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = getRawValue(e.target.value);
    if (rawValue === 0) {
      setMaxDisplay('');
      onLimitChange({ ...limit, max: 0 });
    } else {
      const maxAllowed = amountMZD || Infinity;
      const validatedValue = Math.max(limit.min || 0, Math.min(rawValue, maxAllowed));
      setMaxDisplay(formatCurrency(validatedValue));
      onLimitChange({ ...limit, max: validatedValue });
    }
  };

  return (
    <div className="space-y-4 border-b lg:border-b-0 lg:border-r border-gray-800 pb-4 lg:pb-0 lg:pr-6">
      {/* Header - Compact */}
      <div className="flex items-center gap-2">
        <span className="bg-gray-800 w-5 h-5 rounded-full flex items-center justify-center text-xs text-gray-400 shrink-0">
          1
        </span>
        <h3 className="text-white font-semibold text-sm">Loại lệnh & Tài sản</h3>
      </div>

      {/* Trade Type & Asset - Grid Layout */}
      <div className="grid grid-cols-2 gap-3">
        {/* Trade Type */}
        <div>
          <label className="block text-xs text-gray-500 mb-1.5 font-medium">Hành động</label>
          <div className="flex bg-input/30 dark:bg-input/30 p-0.5 rounded border border-gray-700">
            <button
              onClick={() => onTradeTypeChange('BUY')}
              className={`flex-1 py-1.5 rounded text-xs font-bold transition ${
                tradeType === 'BUY'
                  ? 'text-white bg-brand-primary shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              MUA
            </button>
            <button
              onClick={() => onTradeTypeChange('SELL')}
              className={`flex-1 py-1.5 rounded text-xs font-bold transition ${
                tradeType === 'SELL'
                  ? 'text-white bg-brand-primary shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              BÁN
            </button>
          </div>
        </div>

        {/* Asset */}
        <div>
          <label className="block text-xs text-gray-500 mb-1.5 font-medium">Tài sản</label>
          <div className="bg-input/30 dark:bg-input/30 border border-gray-700 rounded px-3 py-1.5 flex items-center justify-between h-[34px]">
            <span className="font-semibold text-white text-sm">MZD</span>
            <Lock className="h-3 w-3 text-gray-600" />
          </div>
        </div>
      </div>

      {/* Exchange Rate - Only for SELL */}
      {tradeType === 'SELL' && (
        <div className="bg-blue-600/10 border border-blue-600/20 rounded-lg p-3">
          <label className="block text-xs text-blue-400 mb-2 font-medium">
            Tỉ giá bán (VND/MZD)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={rateDisplay}
              onChange={handleRateChange}
              placeholder="0.8"
              className="flex-1 bg-gray-900 border border-gray-700 rounded px-3 py-1.5 text-white text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <span className="text-xs text-gray-400 whitespace-nowrap">VND/MZD</span>
          </div>
          {exchangeRate > 0 && (
            <div className="mt-2 pt-2 border-t border-blue-800/20">
              <div className="text-center">
                <p className="text-xs text-blue-400/80 mb-0.5">Tỷ giá của bạn</p>
                <p className="text-lg font-bold text-white">
                  1 MZD = {exchangeRate.toLocaleString('vi-VN')} VND
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Transaction Limits - Only for SELL */}
      {tradeType === 'SELL' && (
        <div>
          <label className="block text-xs text-gray-500 mb-2 font-medium">
            Giới hạn giao dịch (MZD)
          </label>
          <div className="grid grid-cols-2 gap-3">
            {/* Min Limit */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">Tối thiểu</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="100"
                  value={minDisplay}
                  onChange={handleMinChange}
                  className={`w-full bg-gray-900 border rounded px-3 py-1.5 pr-12 text-white text-sm focus:outline-none focus:ring-1 ${
                    limitErrors?.min
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-700 focus:border-blue-500 focus:ring-blue-500'
                  }`}
                />
                <span className="absolute right-3 top-1.5 text-xs text-gray-500">MZD</span>
              </div>
              {limitErrors?.min && (
                <p className="text-xs text-red-400 mt-1">{limitErrors.min}</p>
              )}
            </div>

            {/* Max Limit */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">Tối đa</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder={amountMZD > 0 ? formatCurrency(amountMZD) : '5,000'}
                  value={maxDisplay}
                  onChange={handleMaxChange}
                  className={`w-full bg-gray-900 border rounded px-3 py-1.5 pr-12 text-white text-sm focus:outline-none focus:ring-1 ${
                    limitErrors?.max
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-700 focus:border-blue-500 focus:ring-blue-500'
                  }`}
                />
                <span className="absolute right-3 top-1.5 text-xs text-gray-500">MZD</span>
              </div>
              {limitErrors?.max && (
                <p className="text-xs text-red-400 mt-1">{limitErrors.max}</p>
              )}
            </div>
          </div>
          {amountMZD > 0 && (
            <p className="text-xs text-gray-500 mt-2">
              Giới hạn tối đa: <span className="text-gray-400 font-medium">{formatCurrency(amountMZD)} MZD</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
};

// Demo Component
export default function Demo() {
  const [tradeType, setTradeType] = useState<TradeType>('SELL');
  const [exchangeRate, setExchangeRate] = useState(0.85);
  const [limit, setLimit] = useState({ min: 100, max: 5000 });
  const [amountMZD] = useState(10000);

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <TradeTypeSection
            tradeType={tradeType}
            onTradeTypeChange={setTradeType}
            exchangeRate={exchangeRate}
            onExchangeRateChange={setExchangeRate}
            limit={limit}
            onLimitChange={setLimit}
            amountMZD={amountMZD}
          />
        </div>
      </div>
    </div>
  );
}