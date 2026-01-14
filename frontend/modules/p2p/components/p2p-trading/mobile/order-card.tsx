'use client';

import { AddressDisplay, Chip } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { APP_CONFIG } from '@/configs/app.config';
import { ROUTES } from '@/configs/routes.config';
import { Countdown } from '../../shared/count-down';
import { getOrderStatusInfo } from '@/modules/p2p/util';
import { P2POrder } from '@/modules/p2p/types';
import { useRouter } from 'next/navigation';
import { NumberUtil } from '@/utils';
interface OrderMobileCardProps {
  order: P2POrder;
}
export const OrderMobileCard = ({ order }: OrderMobileCardProps) => {
  const router = useRouter();
  return (
    <div className="bg-card border-border mb-2 space-y-4 rounded-xl border p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">Order ID</span>
          <p className="text-sm font-bold">#{order.order_id}</p>
          <p className="text-muted-foreground text-xs">Offer #{order.offer_id}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Chip variant={getOrderStatusInfo(order.status)} className="gap-1.5 rounded-sm px-2 py-0.5 text-[11px]">
            <span>{order.status}</span>
          </Chip>
          <Countdown expiresAt={order.expires_at} />
        </div>
      </div>

      <hr className="border-border/50" />

      <div className="grid grid-cols-2 gap-x-2 gap-y-4">
        <div className="flex flex-col">
          <span className="text-muted-foreground text-[10px] font-bold uppercase">Seller</span>
          <AddressDisplay
            addressClassName="text-brand-primary text-sm"
            address={order.seller_wallet_address}
            href={ROUTES.WALLET(order.seller_wallet_address)}
          />
        </div>

        <div className="flex flex-col">
          <span className="text-muted-foreground text-[10px] font-bold uppercase">Buyer</span>
          <AddressDisplay
            addressClassName="text-sm"
            address={order.buyer_wallet_address}
            href={ROUTES.WALLET(order.buyer_wallet_address)}
          />
        </div>

        <div className="bg-secondary/20 col-span-2 flex flex-col rounded-lg p-3">
          <span className="text-muted-foreground mb-1 text-[10px] font-bold uppercase">Amount / Total</span>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-utility-success-600 text-base leading-none font-bold">
                {new Intl.NumberFormat('en-US').format(Number(order.amount))} {APP_CONFIG.CHAIN_SYMBOL}
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                {new Intl.NumberFormat('en-US').format(Number(order.amount * order.price_rate))} VND
              </p>
            </div>
            <div className="text-right">
              <p className="text-muted-foreground mb-1 text-[10px] leading-none font-bold uppercase">Rate</p>
              <p className="text-brand-primary text-xs font-semibold">
                1 {APP_CONFIG.CHAIN_SYMBOL} = {NumberUtil.formatWithCommas(order.price_rate)} VND
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-2">
        <Button
          className="bg-primary/10 text-brand-primary dark:hover:bg-brand-primary dark:bg-brand-primary/10 dark:border-brand-primary dark:text-primary-light flex w-full items-center justify-center rounded-xl py-3 text-sm font-bold transition hover:text-white dark:border dark:hover:text-white"
          onClick={() => router.push(ROUTES.P2P_TRADING_ROOM(order.order_id.toString()))}
        >
          View Order Details
        </Button>
      </div>
    </div>
  );
};
