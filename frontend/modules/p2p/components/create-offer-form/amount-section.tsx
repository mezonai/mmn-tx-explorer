'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';

interface AmountSectionProps {
  amountMZD: number;
  onAmountChange: (amount: number) => void;
  error?: string;
}

// Format số với dấu phẩy
const formatCurrency = (num: number): string => {
  return new Intl.NumberFormat('en-US').format(num);
};

// Lấy giá trị số từ string có dấu phẩy
const getRawValue = (val: string): number => {
  return parseFloat(val.replace(/,/g, '')) || 0;
};

export const AmountSection = ({ amountMZD, onAmountChange, error }: AmountSectionProps) => {
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
    // Visual feedback
    const input = document.getElementById('amountInput');
    if (input) {
      input.classList.add('bg-gray-700');
      setTimeout(() => input.classList.remove('bg-gray-700'), 200);
    }
  };

  // Tính tổng VND nhận về (1:1)
  const totalVND = amountMZD;

  return (
    <div className="space-y-5 border-b lg:border-b-0 lg:border-r border-gray-800 pb-4 lg:pb-0 lg:pr-8">
      <h3 className="text-white font-bold text-sm flex items-center gap-2 mb-3">
        <span className="bg-gray-800 w-5 h-5 rounded-full flex items-center justify-center text-xs text-gray-400">
          2
        </span>
        Khối lượng giao dịch
      </h3>

      <div>
        <label className="block text-xs text-gray-500 mb-2 font-medium uppercase">
          Số tiền MZD muốn bán
        </label>
        <div className="relative group">
          <Input
            id="amountInput"
            type="text"
            placeholder="VD: 5,000,000"
            value={displayValue}
            onChange={handleInputChange}
            className={`w-full bg-input/30 dark:bg-input/30 border-gray-700 rounded-md px-3 py-2.5 text-white focus:border-brand-primary focus:outline-none font-bold text-lg placeholder-gray-600 group-hover:border-gray-600 transition-colors ${
              error ? 'border-red-500' : ''
            }`}
          />
          <span className="absolute right-3 top-3.5 text-gray-500 text-xs font-bold">MZD</span>
        </div>
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}

        <div className="grid grid-cols-4 gap-2 mt-3">
          <button
            onClick={() => setQuickAmount(100000)}
            className="py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded text-xs text-gray-300 transition"
          >
            100k
          </button>
          <button
            onClick={() => setQuickAmount(500000)}
            className="py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded text-xs text-gray-300 transition"
          >
            500k
          </button>
          <button
            onClick={() => setQuickAmount(1000000)}
            className="py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded text-xs text-gray-300 transition"
          >
            1 triệu
          </button>
          <button
            onClick={() => setQuickAmount(5000000)}
            className="py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded text-xs text-gray-300 transition"
          >
            5 triệu
          </button>
        </div>
      </div>

      <div className="pt-2">
        <label className="block text-xs text-gray-500 mb-2 font-medium uppercase">
          Tổng tiền nhận về (VND)
        </label>
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-4 flex flex-col items-center justify-center h-24">
          <span className="text-2xl font-bold text-green-400">{formatCurrency(totalVND)}</span>
          <span className="text-xs text-gray-500 font-bold mt-1">VND</span>
        </div>
      </div>
    </div>
  );
};




