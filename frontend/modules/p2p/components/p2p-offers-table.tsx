'use client';

import { P2POffer } from '../types/p2p.types';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { AdvertiserInfo } from './advertiser-info';
import { APP_CONFIG } from '@/configs/app.config';

interface P2POffersTableProps {
  offers?: P2POffer[];
  isLoading: boolean;
  onOfferClick: (offer: P2POffer) => void;
}

export const P2POffersTable = ({ offers, isLoading, onOfferClick }: P2POffersTableProps) => {
  if (isLoading) {
    return (
      <Card className="bg-card overflow-hidden border-gray-300 dark:border-gray-800">
        <div className="space-y-4 p-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </Card>
    );
  }

  if (!offers || offers.length === 0) {
    return (
      <Card className="bg-card overflow-hidden border-gray-300 dark:border-gray-800">
        <div className="p-12 text-center">
          <p className="lg text-gray-400">Không có offer nào</p>
          <p className="mt-2 text-sm text-gray-500">Các offer sẽ hiển thị ở đây</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-card overflow-hidden border-gray-300 dark:border-gray-800">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead className="xs bg-gray-900 text-xs font-medium text-gray-400 uppercase">
            <tr>
              <th className="px-6 py-4">Advertiser</th>
              <th className="px-6 py-4">Available</th>
              <th className="px-6 py-4">Price</th>
              <th className="px-6 py-4">Limits</th>
              <th className="px-6 py-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800 text-sm">
            {offers.map((offer) => (
              <tr key={offer.offerId} className="transition-colors hover:bg-gray-800/50">
                <td className="px-6 py-4">
                  <AdvertiserInfo walletAddress={offer.sellerWalletAddress} />
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {offer.available.toLocaleString()} {APP_CONFIG.CHAIN_SYMBOL}
                    </span>
                    <span className="text-xs text-gray-500">
                      Total: {offer.totalMZD.toLocaleString()} {APP_CONFIG.CHAIN_SYMBOL}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="font-medium">{offer.exchangeRate.toFixed(4)} VND</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col text-xs">
                    <span>
                      Min: {offer.limit.min.toLocaleString()} {APP_CONFIG.CHAIN_SYMBOL}
                    </span>
                    <span>
                      Max: {offer.limit.max.toLocaleString()} {APP_CONFIG.CHAIN_SYMBOL}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Button
                    onClick={() => onOfferClick(offer)}
                    className="bg-brand-primary hover:bg-brand-primary/90 h-8 rounded-lg px-4 text-xs font-bold text-white"
                  >
                    Buy
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
