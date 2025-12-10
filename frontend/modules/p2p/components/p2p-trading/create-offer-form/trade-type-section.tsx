'use client';

import { TradeTypes } from '@/modules/p2p/types';
import { useState, useEffect } from 'react';

interface TradeTypeSectionProps {
  tradeType: TradeTypes;
  onTradeTypeChange?: (type: TradeTypes) => void;
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
  return new Intl.NumberFormat('en-US').format(num);
};

const getRawValue = (val: string): number => {
  return parseFloat(val.replace(/\./g, '').replace(/,/g, '')) || 0;
};

export const TradeTypeSection = ({
  tradeType,
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

    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setRateDisplay(value);

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
    } else {
      setMinDisplay(formatCurrency(rawValue));
    }
    onLimitChange({ ...limit, min: rawValue });
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = getRawValue(e.target.value);
    if (rawValue === 0) {
      setMaxDisplay('');
    } else {
      setMaxDisplay(formatCurrency(rawValue));
    }
    onLimitChange({ ...limit, max: rawValue });
  };
  return (
    <div className="space-y-4 border-b border-gray-800 pb-4 lg:border-r lg:border-b-0 lg:pr-6 lg:pb-0">
      {/* Header - Compact */}
      <div className="flex items-center gap-2">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-800 text-xs text-gray-400">
          1
        </span>
        <h3 className="text-sm font-semibold text-white">Order Type & Asset</h3>
      </div>

      {/* Trade Type & Asset - Grid Layout */}
      <div className="grid grid-cols-2 gap-3">
        {/* Trade Type */}
        {/* <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-500">Hành động</label>
          <div className="bg-input/30 dark:bg-input/30 flex rounded border border-gray-700 p-0.5">
            <button
              onClick={() => onTradeTypeChange('BUY')}
              className={`flex-1 rounded py-1.5 text-xs font-bold transition ${
                tradeType === 'BUY' ? 'bg-brand-primary text-white shadow' : 'text-gray-400 hover:text-white'
              }`}
            >
              MUA
            </button>
            <button
              onClick={() => onTradeTypeChange('SELL')}
              className={`flex-1 rounded py-1.5 text-xs font-bold transition ${
                tradeType === 'SELL' ? 'bg-brand-primary text-white shadow' : 'text-gray-400 hover:text-white'
              }`}
            >
              BÁN
            </button>
          </div>
        </div> */}

        {/* Asset */}
        {/* <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-500">Tài sản</label>
          <div className="bg-input/30 dark:bg-input/30 flex h-[34px] items-center justify-between rounded border border-gray-700 px-3 py-1.5">
            <span className="text-sm font-semibold text-white">MZD</span>
            <Lock className="h-3 w-3 text-gray-600" />
          </div>
        </div> */}
      </div>

      {/* Exchange Rate - Only for SELL */}
      {tradeType === 'SELL' && (
        <div className="rounded-lg border border-blue-600/20 bg-blue-600/10 p-3">
          <label className="mb-2 block text-xs font-medium text-blue-400">Sell Rate (VND/MZD)</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={rateDisplay}
              onChange={handleRateChange}
              placeholder="0.8"
              className="flex-1 rounded border border-gray-700 bg-gray-900 px-3 py-1.5 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
            <span className="text-xs whitespace-nowrap text-gray-400">VND/MZD</span>
          </div>
          {exchangeRate > 0 && (
            <div className="mt-2 border-t border-blue-800/20 pt-2">
              <div className="text-center">
                <p className="mb-0.5 text-xs text-blue-400/80">Exchange rate</p>
                <p className="text-lg font-bold text-white">1 MZD = {exchangeRate.toLocaleString('en-US')} VND</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Transaction Limits - Only for SELL */}
      {tradeType === 'SELL' && (
        <div>
          <label className="mb-2 block text-xs font-medium text-gray-500">Transaction Limits (MZD)</label>
          <div className="grid grid-cols-2 gap-3">
            {/* Min Limit */}
            <div>
              <label className="mb-1 block text-xs text-gray-400">Minimum</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="100"
                  value={minDisplay}
                  onChange={handleMinChange}
                  className={`w-full rounded border bg-gray-900 px-3 py-1.5 pr-12 text-sm text-white focus:ring-1 focus:outline-none ${
                    limitErrors?.min
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-700 focus:border-blue-500 focus:ring-blue-500'
                  }`}
                />
                <span className="absolute top-1.5 right-3 text-xs text-gray-500">MZD</span>
              </div>
              {limitErrors?.min && <p className="mt-1 text-xs text-red-400">{limitErrors.min}</p>}
            </div>

            {/* Max Limit */}
            <div>
              <label className="mb-1 block text-xs text-gray-400">Maximum</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder={amountMZD > 0 ? formatCurrency(amountMZD) : '5,000'}
                  value={maxDisplay}
                  onChange={handleMaxChange}
                  className={`w-full rounded border bg-gray-900 px-3 py-1.5 pr-12 text-sm text-white focus:ring-1 focus:outline-none ${
                    limitErrors?.max
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-700 focus:border-blue-500 focus:ring-blue-500'
                  }`}
                />
                <span className="absolute top-1.5 right-3 text-xs text-gray-500">MZD</span>
              </div>
              {limitErrors?.max && <p className="mt-1 text-xs text-red-400">{limitErrors.max}</p>}
            </div>
          </div>
          {amountMZD > 0 && (
            <p className="mt-2 text-xs text-gray-500">
              Max limit: <span className="font-medium text-gray-400">{formatCurrency(amountMZD)} MZD</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
};
