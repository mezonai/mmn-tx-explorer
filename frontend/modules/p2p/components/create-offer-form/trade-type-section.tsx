'use client';

import { TradeType } from '../../types/p2p.types';
import { Lock } from 'lucide-react';

interface TradeTypeSectionProps {
  tradeType: TradeType;
  onTradeTypeChange: (type: TradeType) => void;
}

export const TradeTypeSection = ({ tradeType, onTradeTypeChange }: TradeTypeSectionProps) => {
  return (
    <div className="space-y-5 border-b lg:border-b-0 lg:border-r border-gray-800 pb-4 lg:pb-0 lg:pr-8">
      <h3 className="text-white font-bold text-sm flex items-center gap-2 mb-3">
        <span className="bg-gray-800 w-5 h-5 rounded-full flex items-center justify-center text-xs text-gray-400">
          1
        </span>
        Loại lệnh & Tài sản
      </h3>

      <div>
        <label className="block text-xs text-gray-500 mb-2 font-medium uppercase">Hành động</label>
        <div className="flex bg-input/30 dark:bg-input/30 p-1 rounded-md border border-gray-700">
          <button
            onClick={() => onTradeTypeChange('BUY')}
            className={`flex-1 py-2 rounded text-xs font-bold transition ${
              tradeType === 'BUY'
                ? 'text-white bg-brand-primary shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            MUA
          </button>
          <button
            onClick={() => onTradeTypeChange('SELL')}
            className={`flex-1 py-2 rounded text-xs font-bold transition ${
              tradeType === 'SELL'
                ? 'text-white bg-brand-primary shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            BÁN
          </button>
        </div>
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-2 font-medium uppercase">Tài sản</label>
        <div className="bg-input/30 dark:bg-input/30 border border-gray-700 rounded-md px-3 py-2.5 flex items-center justify-between">
          <span className="font-bold text-white text-sm">MZD (Mezon)</span>
          <Lock className="h-3 w-3 text-gray-600" />
        </div>
      </div>

      <div className="pt-2">
        <div className="bg-blue-600/10 border border-blue-600/20 rounded-lg p-4 text-center">
          <span className="text-xs text-blue-400 font-medium uppercase tracking-wider">
            Tỷ giá quy đổi cố định
          </span>
          <div className="text-xl font-bold text-white mt-1">1 MZD = 1 VND</div>
        </div>
      </div>
    </div>
  );
};




