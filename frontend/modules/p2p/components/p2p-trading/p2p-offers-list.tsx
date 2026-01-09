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
import { CancelConfirmDialog } from './cancel-confirm-dialog';
import { OFFERS_STATUS } from '../../constants';
import { TriangleAlert } from 'lucide-react';
import { formatCurrency } from '../../util';

interface P2POffersTableProps {
  offers: P2POffer[] | undefined;
  isLoading?: boolean;
}

export const P2POffersTabs = ({ offers, isLoading = false }: P2POffersTableProps) => {
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
      renderCell: (offer) => (
        <div>
          <div className="mt-1 text-sm text-gray-400">
            <span className="text-brand-primary font-semibold">
              1 {APP_CONFIG.CHAIN_SYMBOL} = {formatCurrency(offer.price_rate)} VND
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
              {formatCurrency(offer.amount)} {APP_CONFIG.CHAIN_SYMBOL}
            </span>
          </span>
          <span>
            <span className="text-gray-500 dark:text-gray-500">Limit:</span>{' '}
            <span className="text-primary font-medium dark:text-white">
              {formatCurrency(offer.limit.min)} - {formatCurrency(offer.limit.max)} {APP_CONFIG.CHAIN_SYMBOL}
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
    {
      headerContent: 'Action',
      renderCell: (offer) => (
        <div className="w-[50%]">
          {offer.has_active_order ? (
            <div className="group relative mx-auto w-full overflow-hidden rounded-lg border border-amber-500/50 bg-amber-500/10 px-1 shadow-[0_0_10px_-3px_rgba(245,158,11,0.2)] backdrop-blur-sm">
              <div className="absolute inset-0 animate-pulse bg-[linear-gradient(45deg,transparent_25%,rgba(245,158,11,0.5)_25%,rgba(245,158,11,0.5)_50%,transparent_50%,transparent_75%,rgba(245,158,11,0.5)_75%,rgba(245,158,11,0.5)_100%)] bg-size-[12px_12px] opacity-20 dark:opacity-10" />

              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2.5s_infinite] bg-linear-to-r from-transparent via-amber-500/10 to-transparent" />

              <div className="relative z-10 flex items-center justify-center gap-2 py-2.5 text-amber-700 dark:text-amber-300">
                <TriangleAlert className="h-4 w-4 stroke-2" />

                <span className="text-xs font-bold tracking-wider whitespace-nowrap uppercase">
                  Trading in Progress
                </span>
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
      ),
      skeletonContent: <Skeleton className="h-9 w-24 rounded-lg" />,
      align: 'center',
    },
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
