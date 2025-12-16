'use client';

import { ArrowLeft, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { P2POrder } from '../../types';
import { AddressDisplay } from '@/components/shared/address-display';
import { ROUTES } from '@/configs/routes.config';
import { useP2POffer } from '../../hooks/useP2POffer';

interface TradingRoomHeaderProps {
  order: P2POrder;
}

export const TradingRoomHeader = ({ order }: TradingRoomHeaderProps) => {
  const router = useRouter();
  const { offer } = useP2POffer(String(order.offer_id));

  // Calculate remaining time
  const remainingTime = useMemo(() => {
    const now = new Date().getTime();
    const expires = new Date(order.expires_at).getTime();
    const diff = Math.max(0, expires - now);
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return { minutes, seconds };
  }, [order.expires_at]);

  const sellerAddress = offer?.seller_wallet_address || '';

  return (
    <header className="bg-card flex h-14 shrink-0 items-center justify-between border-b border-gray-800 px-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="text-gray-400 transition hover:text-white"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-sm font-bold text-white">
            MZD buy order <span className="text-gray-500">#{order.order_id}</span>
          </h1>
          {sellerAddress && (
            <div className="flex items-center gap-1 text-xs text-gray-400">
              Trading with
              <AddressDisplay
                address={sellerAddress}
                href={ROUTES.WALLET(sellerAddress)}
                className="text-brand-primary font-bold"
              />
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 rounded-full bg-yellow-500/10 px-3 py-1 text-sm font-bold text-yellow-500">
        <Clock className="h-4 w-4" />
        {remainingTime.minutes}:{remainingTime.seconds.toString().padStart(2, '0')}
      </div>
    </header>
  );
};
