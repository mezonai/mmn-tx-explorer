'use client';

import { ArrowLeft, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import { P2POrder, P2PTradingRoleType } from '../../types';
import { AddressDisplay } from '@/components/shared/address-display';
import { ROUTES } from '@/configs/routes.config';
import { useP2POffer } from '../../hooks/useP2POffer';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/shared';
import { OrderStatus } from '../../types';
import { TriangleAlert } from 'lucide-react';

interface TradingRoomHeaderProps {
  order: P2POrder;
  userRole?: P2PTradingRoleType | null;
}

export const TradingRoomHeader = ({ order, userRole }: TradingRoomHeaderProps) => {
  const router = useRouter();
  const { offer } = useP2POffer(String(order.offer_id));
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Update current time every second for countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Calculate remaining time and check if expired
  const { remainingTime, isExpired } = useMemo(() => {
    const now = currentTime;
    const expires = new Date(order.expires_at).getTime();
    const diff = Math.max(0, expires - now);
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    const expired = now >= expires;
    return {
      remainingTime: { minutes, seconds },
      isExpired: expired
    };
  }, [order.expires_at, currentTime]);

  // Determine counterparty address based on user role
  const counterpartyAddress = useMemo(() => {
    if (!userRole) return '';

    if (userRole === 'buyer') {
      // If user is buyer, show seller's address
      return order.seller_wallet_address || offer?.seller_wallet_address || '';
    } else {
      // If user is seller, show buyer's address
      return order.buyer_wallet_address || '';
    }
  }, [userRole, order.seller_wallet_address, order.buyer_wallet_address, offer?.seller_wallet_address]);

  return (
    <header className=" flex h-14 shrink-0 items-center justify-between border-b border-border px-2">
      <div className="flex items-center">
        <Button
          onClick={() => router.back()}
          className="text-muted-foreground transition hover:text-foreground"
          aria-label="Go back"
          variant="ghost"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-muted-foreground">
              Order <span className="text-muted-foreground">#{order.order_id}</span>
            </h1>
            {isExpired && order.status !== OrderStatus.COMPLETED && order.status !== OrderStatus.CONFIRMED && (
              <Chip variant="error" className="md:hidden text-[12px] px-1.5 pt-1 pb-0.5 rounded uppercase leading-none">
                <span className="text-red-500">Expired</span>
              </Chip>
            )}
          </div>
          {counterpartyAddress && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              Trading with
              <AddressDisplay
                address={counterpartyAddress}
                href={ROUTES.WALLET(counterpartyAddress)}
                className="text-brand-primary font-bold"
              />
            </div>
          )}
        </div>
      </div>

      {isExpired && order.status !== OrderStatus.COMPLETED && order.status !== OrderStatus.CONFIRMED && (
        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 flex-col items-center pointer-events-none">

          <span className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-red-500"> <TriangleAlert className="h-4 w-4" /> Order has expired</span>
          <span className="text-[12px] text-red-400 mt-0.5 font-medium">This order can no longer be processed</span>
        </div>
      )}
      {order.status !== OrderStatus.COMPLETED && (
        <div
          className={`flex items-center gap-2 rounded-full px-3 py-1 text-sm font-bold ${isExpired ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'
            }`}
        >
          <Clock className="h-4 w-4" />
          {remainingTime.minutes}:{remainingTime.seconds.toString().padStart(2, '0')}
        </div>
      )}
    </header>
  );
};