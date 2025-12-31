'use client';
import { AddressDisplay } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { APP_CONFIG } from '@/configs/app.config';
import { ROUTES } from '@/configs/routes.config';
import { OFFERS_STATUS } from '@/modules/p2p/constants';
import { P2POffer } from '@/modules/p2p/types';
import { useUser } from '@/providers';
import { useRouter } from 'next/navigation';
import React from 'react';
import { CancelConfirmDialog } from '../cancel-confirm-dialog';
import { TriangleAlert } from 'lucide-react';
interface OfferMobileCardProps {
  offer: P2POffer;
}
const OfferMobileCard = ({ offer }: OfferMobileCardProps) => {
  const router = useRouter();
  const { user } = useUser();
  return (
    <div className="bg-card border-border mb-2 space-y-4 rounded-xl border p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">Seller</span>
          <AddressDisplay address={offer.seller_wallet_address} href={ROUTES.WALLET(offer.seller_wallet_address)} />
        </div>
        <div className="text-right">
          <span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">Rate</span>
          <p className="text-brand-primary text-sm font-bold">
            {offer.price_rate.toLocaleString('vi-VN')} VND/{APP_CONFIG.CHAIN_SYMBOL}
          </p>
        </div>
      </div>

      <div className="bg-secondary space-y-3 rounded-lg p-3 dark:bg-white/5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 dark:text-gray-400">Available</span>
          <span className="text-primary text-sm font-semibold dark:text-white">
            {offer.amount.toLocaleString('en-US')} {APP_CONFIG.CHAIN_SYMBOL}
          </span>
        </div>

        <div className="border-border/50 flex items-center justify-between border-t pt-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">Limit</span>
          <span className="text-primary text-right text-sm font-medium dark:text-white">
            {offer.limit.min.toLocaleString('en-US')} - {offer.limit.max.toLocaleString('en-US')}{' '}
            {APP_CONFIG.CHAIN_SYMBOL}
          </span>
        </div>
      </div>

      <div className="pt-1">
        {offer.has_active_order ? (
          <div className="group relative mx-auto w-full overflow-hidden rounded-lg border border-amber-500/50 bg-amber-500/10 px-1 shadow-[0_0_10px_-3px_rgba(245,158,11,0.2)] backdrop-blur-sm">
            <div className="absolute inset-0 animate-pulse bg-[linear-gradient(45deg,transparent_25%,rgba(245,158,11,0.5)_25%,rgba(245,158,11,0.5)_50%,transparent_50%,transparent_75%,rgba(245,158,11,0.5)_75%,rgba(245,158,11,0.5)_100%)] bg-size-[12px_12px] opacity-20 dark:opacity-10" />

            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2.5s_infinite] bg-linear-to-r from-transparent via-amber-500/10 to-transparent" />

            <div className="relative z-10 flex items-center justify-center gap-2 py-2 text-amber-700 dark:text-amber-300">
              <TriangleAlert className="h-4 w-4 stroke-2" />

              <span className="text-xs font-bold tracking-wider whitespace-nowrap uppercase">Trading in Progress</span>
            </div>
          </div>
        ) : user && offer.seller_user_id !== user?.id ? (
          <Button
            onClick={() => {
              router.push(ROUTES.P2P_TRADING_ROOM(offer.offer_id, 'offer'));
            }}
            className="w-full rounded-lg bg-emerald-500 px-6 py-2 font-bold text-white transition hover:bg-emerald-600"
          >
            Buy Mezon đồng
          </Button>
        ) : (
          offer.status !== OFFERS_STATUS.CANCELED && <CancelConfirmDialog offer={offer} />
        )}
      </div>
    </div>
  );
};

export default OfferMobileCard;
