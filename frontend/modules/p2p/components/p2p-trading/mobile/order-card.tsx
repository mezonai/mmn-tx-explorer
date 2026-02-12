'use client';

import { AddressDisplay, Chip } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { APP_CONFIG } from '@/configs/app.config';
import { ROUTES } from '@/configs/routes.config';
import { Countdown } from '../../shared/count-down';
import { NumberUtil } from '@/utils';
import { getOrderStatusInfo } from '@/modules/p2p/util';
import { P2POrder, TradeTypes } from '@/modules/p2p/types';
import { useRouter } from 'next/navigation';
import { useUser } from '@/providers/AppProvider';

interface OrderMobileCardProps {
  order: P2POrder;
}
export const OrderMobileCard = ({ order }: OrderMobileCardProps) => {
  const router = useRouter();
  const { user } = useUser();

  const isOrderCreator = user?.walletAddress === order.order_creator_wallet_address;
  const role = isOrderCreator
    ? order.side === TradeTypes.BUY
      ? 'Seller'
      : 'Buyer'
    : order.side === TradeTypes.BUY
      ? 'Buyer'
      : 'Seller';

  const isActualBuyer = role === 'Buyer';
  const counterpartyAddress = isOrderCreator ? order.offer_creator_wallet_address : order.order_creator_wallet_address;
  const amount = NumberUtil.scaleDownBigIntString(order.amount);
  const vndAmount = amount.multipliedBy(order.price_rate);

  return (
    <div className="bg-card border-border mb-2 space-y-4 rounded-xl border p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">Order ID</span>
            <p className="text-sm font-bold">#{order.order_id}</p>
          </div>
          <p className="text-muted-foreground text-xs leading-none">Offer #{order.offer_id}</p>
          <div className="flex flex-wrap gap-1.5 pt-1">
            <Chip
              variant={order.side === TradeTypes.BUY ? 'outline-info' : 'outline-success'}
              className="rounded-sm px-2 py-0.5 uppercase text-[9px] font-bold"
            >
              {order.side}
            </Chip>
            <Chip
              variant={isActualBuyer ? 'outline-success' : 'outline-info'}
              className="rounded-sm px-2 py-0.5 text-[9px] font-bold"
            >
              {role}
            </Chip>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 text-right">
          <Chip
            variant={getOrderStatusInfo(order.status)}
            className="rounded-sm px-2 py-0.5 text-[10px] font-bold min-w-[70px] justify-center"
          >
            <span>{order.status}</span>
          </Chip>
          <Countdown expiresAt={order.expires_at} />
        </div>
      </div>

      <hr className="border-border/50" />

      <div className="grid grid-cols-2 gap-x-2 gap-y-4">
        <div className="flex flex-col">
          <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-tight">Counterparty</span>
          <AddressDisplay
            addressClassName="text-brand-primary text-sm"
            address={counterpartyAddress}
            href={ROUTES.WALLET(counterpartyAddress)}
          />
        </div>

        <div className="flex flex-col">
          <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-tight text-right">Rate</span>
          <p className="text-brand-primary text-right text-xs font-semibold">
            1 {APP_CONFIG.CHAIN_SYMBOL} = {NumberUtil.formatWithCommas(order.price_rate)} VND
          </p>
        </div>

        <div className="bg-secondary/20 col-span-2 flex flex-col rounded-lg p-3">
          <span className="text-muted-foreground mb-1 text-[10px] font-bold uppercase">Amount</span>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-utility-success-600 text-base font-bold leading-none">
                {amount.toFormat()} {APP_CONFIG.CHAIN_SYMBOL}
              </p>
              <p className="text-muted-foreground mt-1 text-[11px]">
                {isActualBuyer ? 'You pay' : 'You receive'} {vndAmount.toFormat()} VND
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
