'use client';

import { useRouter } from 'next/navigation';
import { ROUTES } from '@/configs/routes.config';
import { Table } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TTableColumn } from '@/types';
import { P2POffer } from '../types/p2p.types';
import { AdvertiserInfo } from './advertiser-info';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface P2POffersTableProps {
  offers: P2POffer[];
  isLoading?: boolean;
  onOfferClick?: (offer: P2POffer) => void;
}

export const P2POffersTable = ({ offers, isLoading = false, onOfferClick }: P2POffersTableProps) => {
  const router = useRouter();

  const handleBuyClick = (offer: P2POffer, e: React.MouseEvent) => {
    e.stopPropagation();
    // Navigate to trading page for offerId
    router.push(ROUTES.P2P_TRADING(String(offer.offerId), 'offer'));
  };

  const columns: TTableColumn<P2POffer>[] = [
    {
      headerContent: 'Seller (Người bán)',
      renderCell: (offer) => <AdvertiserInfo walletAddress={offer.sellerWalletAddress} />,
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
      headerContent: 'MZD / Tỉ giá',
      renderCell: (offer) => (
        <div>
          <div className="text-xl font-bold text-white dark:text-white">
            {offer.totalMZD.toLocaleString('vi-VN')} <span className="text-xs font-normal text-gray-500">MZD</span>
          </div>
          <div className="mt-1 text-sm text-gray-400">
            Tỉ giá:{' '}
            <span className="text-brand-primary font-semibold">
              {offer.exchangeRate.toLocaleString('vi-VN')} VND/MZD
            </span>
          </div>
        </div>
      ),
      skeletonContent: <Skeleton className="h-6 w-24" />,
      align: 'left',
    },
    {
      headerContent: 'Khả dụng / Giới hạn',
      renderCell: (offer) => (
        <div className="flex flex-col gap-1 text-gray-300 dark:text-gray-300">
          <span>
            <span className="text-gray-500 dark:text-gray-500">Khả dụng:</span>{' '}
            <span className="font-medium text-white dark:text-white">
              {offer.available.toLocaleString('vi-VN')} MZD
            </span>
          </span>
          <span>
            <span className="text-gray-500 dark:text-gray-500">Giới hạn:</span>{' '}
            <span className="font-medium text-white dark:text-white">
              {offer.limit.min.toLocaleString('vi-VN')} - {offer.limit.max.toLocaleString('vi-VN')} MZD
            </span>
            <span className="ml-1 text-xs text-gray-500 dark:text-gray-500">/ giao dịch</span>
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
      headerContent: 'Thao tác',
      renderCell: (offer) => (
        <Button
          onClick={(e) => handleBuyClick(offer, e)}
          className="rounded-lg bg-emerald-500 px-6 py-2 font-bold text-white transition hover:bg-emerald-600"
        >
          Mua MZD
        </Button>
      ),
      skeletonContent: <Skeleton className="h-9 w-24 rounded-lg" />,
      align: 'right',
    },
  ];

  return (
    <Card className="bg-card overflow-hidden border-gray-300 dark:border-gray-800">
      <div className="overflow-x-auto">
        <Table<P2POffer>
          columns={columns}
          rows={offers}
          isLoading={isLoading}
          onRowClick={onOfferClick}
          getRowKey={(offer) => offer.offerId}
          className={cn(
            'w-full border-collapse text-left',
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
