'use client';

import { AddressDisplay, Chip } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { APP_CONFIG } from '@/configs/app.config';
import { ROUTES } from '@/configs/routes.config';
import { useUser } from '@/providers';
import { useRouter } from 'next/navigation';
import React from 'react';
import { TriangleAlert } from 'lucide-react';
import { P2POffer } from '@/modules/p2p/types';
import { CancelConfirmDialog } from '../cancel-confirm-dialog';
import { ShareOfferModal } from '../share-offer-modal';
import { OFFERS_STATUS } from '@/modules/p2p/constants';
import { NumberUtil } from '@/utils';

interface OfferMobileCardProps {
  offer: P2POffer;
}

const OfferMobileCard = ({ offer }: OfferMobileCardProps) => {
  const router = useRouter();
  const { user } = useUser();

  const total = offer.total_amount;
  const available = offer.amount;
  const sold = total - available;
  const soldPercentage = total > 0 ? Math.min((sold / total) * 100, 100) : 0;

  return (
    <div className="bg-card border-border mb-3 space-y-4 rounded-xl border p-4 shadow-sm">
      {/* Header: Seller & Rate */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">Seller</span>
          <AddressDisplay address={offer.seller_wallet_address} href={ROUTES.WALLET(offer.seller_wallet_address)} />
        </div>
        <div className="text-right">
          <span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">Rate</span>
          <p className="text-brand-primary text-sm font-bold">
            {NumberUtil.formatWithCommas(offer.price_rate)} VND
            <span className="text-xs font-normal text-gray-500">/{APP_CONFIG.CHAIN_SYMBOL}</span>
          </p>
        </div>
      </div>

      <div className="bg-secondary/50 space-y-4 rounded-lg p-3 dark:bg-white/5">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Available</span>
            <span className="text-brand-primary text-[10px] font-bold tracking-wider uppercase">
              {NumberUtil.formatWithCommas(sold)} {APP_CONFIG.CHAIN_SYMBOL} Sold
            </span>
          </div>

          <div className="flex items-end justify-between gap-2">
            <span className="text-primary text-sm font-bold dark:text-white">
              {NumberUtil.formatWithCommas(available)}{' '}
              <span className="text-muted-foreground text-xs font-normal">
                / {NumberUtil.formatWithCommas(total)} {APP_CONFIG.CHAIN_SYMBOL}
              </span>
            </span>
          </div>

          {/* Progress Bar */}
          <div className="bg-brand-primary/10 relative h-2 w-full overflow-hidden rounded-full">
            <div
              className="bg-brand-primary h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${soldPercentage}%` }}
            />
          </div>
        </div>

        <div className="border-border/50 border-t pt-3">
          {/* Limits Section */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-brand-primary text-[10px] font-bold tracking-wider uppercase">Min Limit</span>
              <span className="text-sm font-bold dark:text-white">
                {NumberUtil.formatWithCommas(offer.limit.min)}
                <span className="ml-1 text-[10px] font-normal text-gray-400">{APP_CONFIG.CHAIN_SYMBOL}</span>
              </span>
            </div>
            <div className="flex flex-col gap-1 text-right">
              <span className="text-brand-primary text-[10px] font-bold tracking-wider uppercase">Max Limit</span>
              <span className="text-sm font-bold dark:text-white">
                {NumberUtil.formatWithCommas(offer.limit.max)}
                <span className="ml-1 text-[10px] font-normal text-gray-400">{APP_CONFIG.CHAIN_SYMBOL}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Section */}
      <div className="pt-1">
        {offer.has_active_order ? (
          <div className="group relative mx-auto w-full overflow-hidden rounded-lg border border-amber-500/50 bg-amber-500/10 px-1 shadow-[0_0_10px_-3px_rgba(245,158,11,0.2)] backdrop-blur-sm">
            <div className="absolute inset-0 animate-pulse bg-[linear-gradient(45deg,transparent_25%,rgba(245,158,11,0.5)_25%,rgba(245,158,11,0.5)_50%,transparent_50%,transparent_75%,rgba(245,158,11,0.5)_75%,rgba(245,158,11,0.5)_100%)] bg-size-[12px_12px] opacity-20 dark:opacity-10" />

            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2.5s_infinite] bg-linear-to-r from-transparent via-amber-500/10 to-transparent" />

            <div className="relative z-10 flex items-center justify-center gap-2 py-2.5 text-amber-700 dark:text-amber-300">
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
        ) : offer.status === OFFERS_STATUS.CANCELED ? (
          <Chip variant="error" className="w-full justify-center py-2 rounded-lg">
            CANCELED
          </Chip>
        ) : offer.status === OFFERS_STATUS.COMPLETED ? (
          <Chip variant="success" className="w-full justify-center py-2 rounded-lg">
            COMPLETED
          </Chip>
        ) : offer.status === OFFERS_STATUS.FAILED ? (
          <Chip variant="error" className="w-full justify-center py-2 rounded-lg">
            FAILED
          </Chip>
        ) : offer.status === OFFERS_STATUS.OPEN ? (
          <Chip variant="warning" className="w-full justify-center py-2 rounded-lg">
            OPEN
          </Chip>
        ) : offer.status === OFFERS_STATUS.CONFIRMED ? (
          <div className="flex w-full items-center gap-2">
            <div className="flex-1">
              <CancelConfirmDialog offer={offer} />
            </div>
            <ShareOfferModal offer={offer} />
          </div>
        ) : (
          <Chip variant="default" className="w-full justify-center py-2 rounded-lg">
            {offer.status}
          </Chip>
        )}
      </div>
    </div>
  );
};

export default OfferMobileCard;
