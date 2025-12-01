'use client';

import { ArrowLeft, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { P2POrder } from '../../types/p2p.types';

interface TradingRoomHeaderProps {
  order: P2POrder;
}

export const TradingRoomHeader = ({ order }: TradingRoomHeaderProps) => {
  const router = useRouter();

  // Calculate remaining time
  const remainingTime = useMemo(() => {
    const now = new Date().getTime();
    const expires = new Date(order.expiresAt).getTime();
    const diff = Math.max(0, expires - now);
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return { minutes, seconds };
  }, [order.expiresAt]);

  return (
    <header className="h-14 border-b border-gray-800 flex items-center px-6 bg-card justify-between shrink-0">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="text-gray-400 hover:text-white transition"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="font-bold text-white text-sm">
            Đơn mua MZD <span className="text-gray-500">#{order.id}</span>
          </h1>
          <div className="text-xs text-gray-400">
            Đang giao dịch với <span className="text-brand-primary font-bold">{order.sellerUsername}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 text-yellow-500 bg-yellow-500/10 px-3 py-1 rounded-full text-sm font-bold">
        <Clock className="h-4 w-4" />
        {remainingTime.minutes}:{remainingTime.seconds.toString().padStart(2, '0')}
      </div>
    </header>
  );
};




