import { AddressDisplay } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { APP_CONFIG } from '@/configs/app.config';
import { ROUTES } from '@/configs/routes.config';
import { P2POffer } from '@/modules/p2p/types';
import React from 'react';
interface OfferMobileCardProps {
  offer: P2POffer;
}
const OfferMobileCard = ({ offer }: OfferMobileCardProps) => {
  return (
    <div className="bg-background border-border mb-2 space-y-4 rounded-xl border p-4 shadow-sm">
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
        <Button className="w-full rounded-xl bg-emerald-500 py-3 font-bold text-white shadow-md transition hover:bg-emerald-600 active:scale-[0.98]">
          Buy Mezon Đồng
        </Button>
      </div>
    </div>
  );
};

export default OfferMobileCard;
