'use client';

import { Table } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TTableColumn } from '@/types';
import { P2POffer } from '../types/p2p.types';
import { AdvertiserInfo } from './advertiser-info';
import { PaymentMethods } from './payment-methods';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface P2POffersTableProps {
  offers: P2POffer[];
  isLoading?: boolean;
  onOfferClick?: (offer: P2POffer) => void;
}

export const P2POffersTable = ({ offers, isLoading = false, onOfferClick }: P2POffersTableProps) => {
  const columns: TTableColumn<P2POffer>[] = [
    {
      headerContent: 'Advertiser (Người bán)',
      renderCell: (offer) => <AdvertiserInfo advertiser={offer.advertiser} isClanOffer={offer.isClanOffer} />,
      skeletonContent: (
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ),
      align: 'left',
    },
    {
      headerContent: 'Giá (VND)',
      renderCell: (offer) => (
        <div>
          <div
            className={cn(
              'text-xl font-bold',
              offer.isClanOffer ? 'text-emerald-500 dark:text-emerald-400' : 'text-white dark:text-white'
            )}
          >
            {offer.price.toLocaleString('vi-VN')}{' '}
            <span className="text-xs font-normal text-gray-500">VND</span>
          </div>
          {offer.isClanOffer && offer.clanDiscount && (
            <div className="text-xs text-brand-primary">Giá ưu đãi cho Clan</div>
          )}
        </div>
      ),
      skeletonContent: <Skeleton className="h-6 w-24" />,
      align: 'left',
    },
    {
      headerContent: 'Giới hạn / Khả dụng',
      renderCell: (offer) => (
        <div className="flex flex-col gap-1 text-gray-300 dark:text-gray-300">
          <span>
            <span className="text-gray-500 dark:text-gray-500">Khả dụng:</span> {offer.available.toLocaleString('vi-VN')} MZD
          </span>
          <span>
            <span className="text-gray-500 dark:text-gray-500">Giới hạn:</span>{' '}
            {offer.limit.min.toLocaleString('vi-VN')} - {offer.limit.max.toLocaleString('vi-VN')} VND
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
      headerContent: 'Thanh toán',
      renderCell: (offer) => <PaymentMethods methods={offer.paymentMethods} />,
      skeletonContent: (
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16 rounded" />
          <Skeleton className="h-6 w-16 rounded" />
        </div>
      ),
      align: 'left',
    },
    {
      headerContent: 'Thao tác',
      renderCell: (offer) => (
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onOfferClick?.(offer);
          }}
          className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-6 rounded-lg transition"
        >
          Mua MZD
        </Button>
      ),
      skeletonContent: <Skeleton className="h-9 w-24 rounded-lg" />,
      align: 'right',
    },
  ];

  return (
    <Card className="overflow-hidden border-gray-300 dark:border-gray-800 bg-card">
      <div className="overflow-x-auto">
        <Table<P2POffer>
          columns={columns}
          rows={offers}
          isLoading={isLoading}
          onRowClick={onOfferClick}
          getRowKey={(offer) => offer.id}
          className={cn(
            'w-full text-left border-collapse',
            '[&_thead]:bg-gray-900 dark:[&_thead]:bg-gray-900',
            '[&_thead]:text-gray-400 dark:[&_thead]:text-gray-400',
            '[&_thead]:text-xs',
            '[&_thead]:uppercase',
            '[&_thead]:font-medium',
            '[&_tbody]:divide-y [&_tbody]:divide-gray-800 dark:[&_tbody]:divide-gray-800',
            '[&_tbody]:text-sm',
            '[&_tbody_tr]:hover:bg-gray-800/50 dark:[&_tbody_tr]:hover:bg-gray-800/50',
            '[&_tbody_tr]:transition-colors'
          )}
          classNameLayout="rounded-xl"
          nullDataContext="Không có offer nào phù hợp với bộ lọc của bạn"
        />
      </div>
    </Card>
  );
};

