'use client';

import { Table } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TTableColumn } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/configs/routes.config';
import { AddressDisplay, Chip } from '@/components/shared';
import { P2POffer } from '../../types';
import { APP_CONFIG } from '@/configs/app.config';
import { useRouter } from 'next/navigation';
import { useUser } from '@/providers';
import { CancelConfirmDialog } from './cancel-confirm-dialog';
import { OFFERS_STATUS } from '../../constants';
import { ShareOfferModal } from './share-offer-modal';
import { TriangleAlert } from 'lucide-react';
import { NumberUtil } from '@/utils';

interface P2POffersTableProps {
  offers: P2POffer[] | undefined;
  isLoading?: boolean;
}

export const P2POffersTabs = ({ offers, isLoading = false }: P2POffersTableProps) => {
  const router = useRouter();
  const { user } = useUser();
  const rawColumns: (TTableColumn<P2POffer> | null)[] = [
    {
      headerContent: 'SELLER',
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
              1 {APP_CONFIG.CHAIN_SYMBOL} = {NumberUtil.formatWithCommas(offer.price_rate)} VND
            </span>
          </div>
        </div>
      ),
      skeletonContent: <Skeleton className="h-6 w-24" />,
      align: 'left',
    },
    {
      headerContent: 'AVAILABLE',
      renderCell: (offer) => {
        const total = offer.total_amount;
        const available = offer.amount;
        const sold = total - available;
        const soldPercentage = total > 0 ? Math.min((sold / total) * 100, 100) : 0;

        return (
          <div className="flex flex-col gap-2 text-left">
            <div className="flex flex-col gap-0.5 text-gray-300 dark:text-gray-300">
              <span className="text-primary font-bold dark:text-white">
                {NumberUtil.formatWithCommas(available)} / {NumberUtil.formatWithCommas(total)}{' '}
                {APP_CONFIG.CHAIN_SYMBOL}
              </span>
              <span className="text-brand-primary text-[10px] font-bold tracking-wider uppercase">
                {NumberUtil.formatWithCommas(sold)} {APP_CONFIG.CHAIN_SYMBOL} Sold
              </span>
            </div>
            <div className="w-50 space-y-1.5">
              <div className="bg-brand-primary/10 relative h-2 w-full overflow-hidden rounded-full">
                <div
                  className="bg-brand-primary h-full rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${soldPercentage}%` }}
                />
              </div>
            </div>
          </div>
        );
      },
      skeletonContent: (
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-2 w-32 rounded-full" />
        </div>
      ),
      align: 'left',
    },
    {
      headerContent: 'LIMITS',
      renderCell: (offer) => {
        return (
          <div className="relative border-l-2 border-gray-200 py-0.5 pl-3 dark:border-gray-700">
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-brand-primary w-6 text-[10px] font-bold tracking-wider uppercase">Min</span>
              <span className="text-sm font-bold dark:text-white whitespace-nowrap">
                {NumberUtil.formatWithCommas(offer.limit.min)}{' '}
                <span className="text-xs font-normal text-gray-400">{APP_CONFIG.CHAIN_SYMBOL}</span>
              </span>
            </div>

            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-brand-primary w-6 text-[10px] font-bold tracking-wider uppercase">Max</span>
              <span className="text-sm font-bold dark:text-white whitespace-nowrap">
                {NumberUtil.formatWithCommas(offer.limit.max)}{' '}
                <span className="text-xs font-normal text-gray-400">{APP_CONFIG.CHAIN_SYMBOL}</span>
              </span>
            </div>
          </div>
        );
      },
      skeletonContent: (
        <div className="space-y-2 border-l-2 border-gray-200 pl-3">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-24" />
        </div>
      ),
      align: 'left',
    },
    {
      headerContent: 'Action',
      renderCell: (offer) => {
        const isUserSeller = user && offer.seller_user_id === user?.id;

        return (
          <div className="flex items-center justify-center">
            {isUserSeller && offer.has_active_order ? (
              <div className="group relative w-[160px] overflow-hidden rounded-lg border border-amber-500/50 bg-amber-500/10 px-1 shadow-[0_0_10px_-3px_rgba(245,158,11,0.2)] backdrop-blur-sm">
                <div className="absolute inset-0 animate-pulse bg-[linear-gradient(45deg,transparent_25%,rgba(245,158,11,0.5)_25%,rgba(245,158,11,0.5)_50%,transparent_50%,transparent_75%,rgba(245,158,11,0.5)_75%,rgba(245,158,11,0.5)_100%)] bg-size-[12px_12px] opacity-20 dark:opacity-10" />

                <div className="absolute inset-0 -translate-x-full animate-[shimmer_2.5s_infinite] bg-linear-to-r from-transparent via-amber-500/10 to-transparent" />

                <div className="relative z-10 flex items-center justify-center gap-2 py-2.5 text-amber-700 dark:text-amber-300">
                  <TriangleAlert className="h-4 stroke-2" />
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
                className="w-[160px] rounded-lg bg-emerald-500 px-6 py-2 text-white transition hover:bg-emerald-600 whitespace-nowrap"
              >
                Buy Mezon đồng
              </Button>
            ) : offer.status === OFFERS_STATUS.CANCELED ? (
              <Chip variant="error" className="w-[160px] rounded-lg justify-center py-2">
                CANCELED
              </Chip>
            ) : offer.status === OFFERS_STATUS.COMPLETED ? (
              <Chip variant="success" className="w-[160px] rounded-lg justify-center py-2">
                COMPLETED
              </Chip>
            ) : offer.status === OFFERS_STATUS.FAILED ? (
              <Chip variant="error" className="w-[160px] rounded-lg justify-center py-2">
                FAILED
              </Chip>
            ) : offer.status === OFFERS_STATUS.OPEN ? (
              <Chip variant="warning" className="w-[160px] rounded-lg justify-center py-2">
                OPEN
              </Chip>
            ) : offer.status === OFFERS_STATUS.CONFIRMED ? (
              <div className="flex items-center gap-2">
                <div className="w-9 opacity-0 pointer-events-none" aria-hidden="true" />
                <div className="w-[160px]">
                  <CancelConfirmDialog offer={offer} />
                </div>
                <ShareOfferModal offer={offer} />
              </div>
            ) : (
              <Chip variant="default" className="w-[160px] rounded-lg justify-center py-2">
                {offer.status}
              </Chip>
            )}
          </div>
        );
      },
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