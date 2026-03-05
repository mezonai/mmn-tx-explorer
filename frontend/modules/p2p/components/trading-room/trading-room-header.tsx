'use client';

import { ArrowLeft, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import { Countdown } from '../shared/count-down';
import { P2POrder, P2PTradingRoleType, TradeTypes } from '../../types';
import { AddressDisplay } from '@/components/shared/address-display';
import { ROUTES } from '@/configs/routes.config';
import { useP2POffer } from '../../hooks/useP2POffer';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/shared';
import { OrderStatus } from '../../types';
import { TriangleAlert } from 'lucide-react';
import { P2P_TRADING_ROLE } from '../../constants';

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

  // Check if expired
  const isExpired = useMemo(() => {
    const now = currentTime;
    const expires = new Date(order.expires_at).getTime();
    return now >= expires;
  }, [order.expires_at, currentTime]);

  // Determine counterparty address based on user role
  const counterpartyAddress = useMemo(() => {
    if (!userRole) return '';

    const offerSide = order.offer_type || offer?.side;
    const isOfferCreator =
      (offerSide === TradeTypes.BUY && userRole === P2P_TRADING_ROLE.BUYER) ||
      (offerSide === TradeTypes.SELL && userRole === P2P_TRADING_ROLE.SELLER);

    return isOfferCreator
      ? order.order_creator_wallet_address || ''
      : order.offer_creator_wallet_address || offer?.offer_creator_wallet_address || '';
  }, [userRole, order, offer]);

  return (
    <header className="border-border flex h-14 shrink-0 items-center justify-between border-b px-2">
      <div className="flex items-center">
        <Button
          onClick={() => router.push(ROUTES.P2P)}
          className="text-muted-foreground transition hover:text-foreground"
          aria-label="Go back"
          variant="ghost"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-muted-foreground text-sm font-bold">
              Order <span className="text-muted-foreground">#{order.order_id}</span>
            </h1>
            {isExpired && order.status !== OrderStatus.COMPLETED && order.status !== OrderStatus.CONFIRMED && (
              <Chip variant="error" className="rounded px-1.5 pt-1 pb-0.5 text-[12px] leading-none uppercase md:hidden">
                <span className="text-red-500">Expired</span>
              </Chip>
            )}
          </div>
          {counterpartyAddress && (
            <div className="text-muted-foreground flex items-center gap-1 text-xs">
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
        <div className="pointer-events-none absolute left-1/2 hidden -translate-x-1/2 flex-col items-center md:flex">
          <span className="flex items-center gap-2 text-sm font-black tracking-wider text-red-500 uppercase">
            {' '}
            <TriangleAlert className="h-4 w-4" /> Order has expired
          </span>
          <span className="mt-0.5 text-[12px] font-medium text-red-400">This order can no longer be processed</span>
        </div>
      )}
      {order.status !== OrderStatus.COMPLETED && (
        <div
          className={`flex items-center gap-2 rounded-full px-3 py-1 text-sm font-bold ${
            isExpired ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'
          }`}
        >
          <Clock className="h-4 w-4" />
          <Countdown expiresAt={order.expires_at} className="m-0" />
        </div>
      )}
    </header>
  );
};
