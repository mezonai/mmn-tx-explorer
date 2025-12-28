'use client';

import { Table } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TTableColumn } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/configs/routes.config';
import { AddressDisplay } from '@/components/shared';
import { P2POffer } from '../../types';
import { APP_CONFIG } from '@/configs/app.config';
import { useRouter } from 'next/navigation';
import { useUser } from '@/providers';

interface P2POffersTableProps {
  offers: P2POffer[] | undefined;
  isLoading?: boolean;
  showAction?: boolean;
}

export const P2POffersTabs = ({ offers, isLoading = false, showAction = true }: P2POffersTableProps) => {
  const router = useRouter();
  const { user } = useUser();
  const rawColumns: (TTableColumn<P2POffer> | null)[] = [
    {
      headerContent: 'Seller',
      renderCell: (offer) => (
        <AddressDisplay address={offer.seller_wallet_address} href={ROUTES.WALLET(offer.seller_wallet_address)} />
      ),
      skeletonContent: <Skeleton className="h-3 w-24" />,
      align: 'left',
    },
    {
      headerContent: 'RATE',
      renderCell: (order) => (
        <div>
          <div className="mt-1 text-sm text-gray-400">
            <span className="text-brand-primary font-semibold">
              1 {APP_CONFIG.CHAIN_SYMBOL} = {order.price_rate.toLocaleString('vi-VN')} VND
            </span>
          </div>
        </div>
      ),
      skeletonContent: <Skeleton className="h-6 w-24" />,
      align: 'left',
    },
    {
      headerContent: 'Available / Limit',
      renderCell: (offer) => (
        <div className="flex flex-col gap-1 text-left text-gray-300 dark:text-gray-300">
          <span>
            <span className="text-gray-500 dark:text-gray-500">Available:</span>{' '}
            <span className="text-primary font-medium dark:text-white">
              {offer.amount.toLocaleString('en-US')} {APP_CONFIG.CHAIN_SYMBOL}
            </span>
          </span>
          <span>
            <span className="text-gray-500 dark:text-gray-500">Limit:</span>{' '}
            <span className="text-primary font-medium dark:text-white">
              {offer.limit.min.toLocaleString('en-US')} - {offer.limit.max.toLocaleString('en-US')}{' '}
              {APP_CONFIG.CHAIN_SYMBOL}
            </span>
          </span>
        </div>
      ),
      skeletonContent: (
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-48" />
        </div>
      ),
      align: 'left',
    },
    showAction
      ? {
          headerContent: 'Action',
          renderCell: (offer) =>
            user && offer.seller_user_id !== user.id ? (
              <Button
                onClick={() => {
                  router.push(ROUTES.P2P_TRADING_ROOM(offer.offer_id, 'offer'));
                }}
                className="rounded-lg bg-emerald-500 px-6 py-2 font-bold text-white transition hover:bg-emerald-600"
              >
                Buy Mezon đồng
              </Button>
            ) : null,
          skeletonContent: <Skeleton className="h-9 w-24 rounded-lg" />,
          align: 'center',
        }
      : null,
  ];
  const columns = rawColumns.filter((col): col is TTableColumn<P2POffer> => col !== null);

  return (
    <Card className="bg-card overflow-hidden border-gray-300 dark:border-gray-800">
      <div className="overflow-x-auto">
        <Table<P2POffer>
          columns={columns}
          rows={offers}
          isLoading={isLoading}
          classNameLayout="rounded-xl"
          nullDataContext="No offers match your filters"
        />
      </div>
    </Card>
  );
};
