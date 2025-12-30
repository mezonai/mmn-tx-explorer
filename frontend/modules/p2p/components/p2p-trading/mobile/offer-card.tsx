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
        {user && offer.seller_user_id !== user.id ? (
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
