'use client';

import { Table } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TTableColumn } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useRef, useState } from 'react';
import { ROUTES } from '@/configs/routes.config';
import { AddressDisplay, Chip } from '@/components/shared';
import { P2POffer, TradeTypes } from '../../types';
import { APP_CONFIG } from '@/configs/app.config';
import { useRouter } from 'next/navigation';
import { useUser } from '@/providers';
import { CancelConfirmDialog } from './cancel-confirm-dialog';
import { OFFERS_STATUS } from '../../constants';
import BigNumber from 'bignumber.js';
import { OfferOrdersModal } from './offer-orders-modal';
import { ShareOfferModal } from './share-offer-modal';
import { TriangleAlert } from 'lucide-react';
import { NumberUtil } from '@/utils';
import { cn } from '@/lib/utils';

interface P2POffersTableProps {
  offers: P2POffer[] | undefined;
  isLoading?: boolean;
  isRefreshing?: boolean;
  onCancelStart?: (offerId: string) => void;
  isMyOffer?: boolean;
}

export const P2POffersTabs = ({
  offers,
  isLoading = false,
  isRefreshing = false,
  onCancelStart,
  isMyOffer = false,
}: P2POffersTableProps) => {
  const router = useRouter();
  const { user } = useUser();

  const [showOverlay, setShowOverlay] = useState(false);
  const hideTimeoutRef = useRef<number | null>(null);

  const [selectedOfferForOrders, setSelectedOfferForOrders] = useState<P2POffer | null>(null);
  const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(false);

  const handleShowOrders = (offer: P2POffer) => {
    setSelectedOfferForOrders(offer);
    setIsOrdersModalOpen(true);
  };

  // Show overlay when refreshing (shared timeout ref)
  useEffect(() => {
    if (isRefreshing) {
      setShowOverlay(true);
      if (hideTimeoutRef.current !== null) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
    } else {
      hideTimeoutRef.current = window.setTimeout(() => {
        setShowOverlay(false);
        hideTimeoutRef.current = null;
      }, 300);
    }

    return () => {
      if (hideTimeoutRef.current !== null) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
    };
  }, [isRefreshing]);

  // Show overlay briefly when new offers arrive
  const prevOfferIdsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!offers) {
      prevOfferIdsRef.current = new Set();
      return;
    }

    const prevIds = prevOfferIdsRef.current;
    const currIds = new Set(offers.map((o) => o.offer_id));

    let added = false;
    currIds.forEach((id) => {
      if (!prevIds.has(id)) added = true;
    });

    prevOfferIdsRef.current = currIds;

    // If new offers added and not already refreshing, show overlay briefly
    if (added && !isRefreshing) {
      setShowOverlay(true);
      if (hideTimeoutRef.current !== null) {
        clearTimeout(hideTimeoutRef.current);
      }
      hideTimeoutRef.current = window.setTimeout(() => {
        setShowOverlay(false);
        hideTimeoutRef.current = null;
      }, 800);
    }
  }, [offers, isRefreshing]);

  const rows = offers ?? [];

  const rawColumns: (TTableColumn<P2POffer> | null)[] = [
    {
      headerContent: 'SELLER',
      renderCell: (offer) => (
        <AddressDisplay address={offer.seller_wallet_address} href={ROUTES.WALLET(offer.seller_wallet_address)} />
      ),
      skeletonContent: <Skeleton className="h-3 w-24" />,
      align: 'left',
    },
    isMyOffer ? {
      headerContent: 'TYPE',
      renderCell: (offer) => (
        <Chip
          variant={offer.side === TradeTypes.SELL ? 'error' : 'success'}
          className={cn(
            "w-16 justify-center rounded-full py-0.5 text-[10px] font-bold",
            offer.side === TradeTypes.SELL
              ? "bg-red-500/10 text-red-500 border-red-500/20"
              : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
          )}
        >
          {offer.side}
        </Chip>
      ),
      skeletonContent: <Skeleton className="h-5 w-16 rounded-full" />,
      align: 'left',
    } : null,
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
        const total = NumberUtil.scaleDownBigNumber(new BigNumber(offer.total_amount));
        const available = NumberUtil.scaleDownBigNumber(new BigNumber(offer.amount));
        const sold = total.minus(available);
        const soldPercentage = total.isGreaterThan(0) ? Math.min(sold.dividedBy(total).multipliedBy(100).toNumber(), 100) : 0;

        return (
          <div className="flex flex-col gap-2 text-left">
            <div className="flex flex-col gap-0.5 text-gray-300 dark:text-gray-300">
              <span className="text-primary font-bold dark:text-white">
                {available.toFormat()} / {total.toFormat()}{' '}
                {APP_CONFIG.CHAIN_SYMBOL}
              </span>
              <span className="text-brand-primary text-[10px] font-bold tracking-wider uppercase">
                {sold.toFormat()} {APP_CONFIG.CHAIN_SYMBOL} Sold
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
    isMyOffer ? {
      headerContent: 'ORDERS',
      renderCell: (offer) => (
        <Button
          variant="outline"
          size="sm"
          className="h-8 border-gray-700 bg-gray-800/50 hover:bg-gray-800"
          onClick={() => handleShowOrders(offer)}
        >
          <span className="text-gray-300">{offer.order_count ?? 0} orders</span>
        </Button>
      ),
      skeletonContent: <Skeleton className="h-8 w-20 rounded-md" />,
      align: 'left',
    } : null,
    {
      headerContent: 'LIMITS',
      renderCell: (offer) => {
        return (
          <div className="relative border-l-2 border-gray-200 py-0.5 pl-3 dark:border-gray-700">
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-brand-primary w-6 text-[10px] font-bold tracking-wider uppercase">Min</span>
              <span className="text-sm font-bold dark:text-white whitespace-nowrap">
                {NumberUtil.formatAndScaleDownBigNumber(new BigNumber(offer.limit.min))}{' '}
                <span className="text-xs font-normal text-gray-400">{APP_CONFIG.CHAIN_SYMBOL}</span>
              </span>
            </div>

            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-brand-primary w-6 text-[10px] font-bold tracking-wider uppercase">Max</span>
              <span className="text-sm font-bold dark:text-white whitespace-nowrap">
                {NumberUtil.formatAndScaleDownBigNumber(new BigNumber(offer.limit.max))}{' '}
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
                className="w-[160px] rounded-lg bg-emerald-500 px-6 py-2 whitespace-nowrap text-white transition hover:bg-emerald-600"
              >
                {offer.side === TradeTypes.SELL ? 'Buy' : 'Sell'} Mezon đồng
              </Button>
            ) : offer.status === OFFERS_STATUS.CANCELED ? (
              <Chip variant="error" className="w-[160px] justify-center rounded-lg py-2">
                CANCELED
              </Chip>
            ) : offer.status === OFFERS_STATUS.COMPLETED ? (
              <Chip variant="success" className="w-[160px] justify-center rounded-lg py-2">
                COMPLETED
              </Chip>
            ) : offer.status === OFFERS_STATUS.FAILED ? (
              <Chip variant="error" className="w-[160px] justify-center rounded-lg py-2">
                FAILED
              </Chip>
            ) : offer.status === OFFERS_STATUS.OPEN ? (
              <Chip variant="warning" className="w-[160px] justify-center rounded-lg py-2">
                OPEN
              </Chip>
            ) : offer.status === OFFERS_STATUS.CONFIRMED ? (
              <div className="flex items-center gap-2">
                <div className="pointer-events-none w-9 opacity-0" aria-hidden="true" />
                <div className="w-[160px]">
                  <CancelConfirmDialog offer={offer} onCancelStart={onCancelStart} />
                </div>
                <ShareOfferModal offer={offer} />
              </div>
            ) : (
              <Chip variant="default" className="w-[160px] justify-center rounded-lg py-2">
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
    <Card className="bg-card relative overflow-hidden border-gray-300 dark:border-gray-800">
      {/* Refresh overlay */}
      {showOverlay && (
        <div className="pointer-events-none absolute inset-x-0 bottom-6 z-50 flex items-center justify-center p-0 md:right-auto md:left-6 md:justify-start">
          <div className="flex items-center gap-2 rounded-md bg-white/85 px-3 py-1 shadow-lg backdrop-blur-sm dark:bg-black/70">
            <div className="h-3 w-3 animate-pulse rounded-full bg-emerald-500" />
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <Table<P2POffer>
          columns={columns}
          rows={rows}
          getRowKey={(r) => r.offer_id}
          isLoading={isLoading}
          isRefreshing={isRefreshing}
          classNameLayout="rounded-xl"
          nullDataContext="No offers match your filters"
        />
      </div>

      <OfferOrdersModal
        offer={selectedOfferForOrders}
        open={isOrdersModalOpen}
        onOpenChange={setIsOrdersModalOpen}
      />
    </Card>
  );
};
