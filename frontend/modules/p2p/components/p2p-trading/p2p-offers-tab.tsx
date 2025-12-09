'use client';

import { Table } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TTableColumn } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/configs/routes.config';
import { AddressDisplay } from '@/components/shared';
import { P2POffer } from '../../types';

interface P2POffersTableProps {
  offers: P2POffer[] | undefined;
  isLoading?: boolean;
}

export const P2POffersTabs = ({ offers, isLoading = false }: P2POffersTableProps) => {
  const columns: TTableColumn<P2POffer>[] = [
    {
      headerContent: 'Seller',
      renderCell: (offer) => (
        <AddressDisplay address={offer.wallet_address} href={ROUTES.WALLET(offer.wallet_address)} />
      ),
      skeletonContent: <Skeleton className="h-3 w-24" />,
      align: 'left',
    },
    {
      headerContent: 'MZD / Rate',
      renderCell: (offer) => (
        <div>
          <div className="text-primary text-xl font-bold dark:text-white">
            {offer.total_quantity.toLocaleString('en-US')}{' '}
            <span className="text-xs font-normal text-gray-500">MZD</span>
          </div>
          <div className="mt-1 text-sm text-gray-400">
            Exchange Rate:{' '}
            <span className="text-brand-primary font-semibold">{offer.price_rate.toLocaleString('vi-VN')} VND/MZD</span>
          </div>
        </div>
      ),
      skeletonContent: <Skeleton className="h-6 w-24" />,
      align: 'center',
    },
    {
      headerContent: 'Available / Limit',
      renderCell: (offer) => (
        <div className="flex flex-col gap-1 text-gray-300 dark:text-gray-300">
          <span>
            <span className="text-gray-500 dark:text-gray-500">Available:</span>{' '}
            <span className="text-primary font-medium dark:text-white">
              {offer.quantity.toLocaleString('en-US')} MZD
            </span>
          </span>
          <span>
            <span className="text-gray-500 dark:text-gray-500">Limit:</span>{' '}
            <span className="text-primary font-medium dark:text-white">
              {offer.limit.min.toLocaleString('en-US')} - {offer.limit.max.toLocaleString('en-US')} MZD
            </span>
            <span className="ml-1 text-xs text-gray-500 dark:text-gray-500">/ transaction</span>
          </span>
        </div>
      ),
      skeletonContent: (
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-48" />
        </div>
      ),
      align: 'center',
    },
    {
      headerContent: 'Action',
      renderCell: () => (
        <Button className="rounded-lg bg-emerald-500 px-6 py-2 font-bold text-white transition hover:bg-emerald-600">
          Buy đồng
        </Button>
      ),
      skeletonContent: <Skeleton className="h-9 w-24 rounded-lg" />,
      align: 'center',
    },
  ];

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
