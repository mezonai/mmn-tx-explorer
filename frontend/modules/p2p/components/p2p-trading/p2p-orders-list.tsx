'use client';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { P2POrder } from '../../types';
import { Table } from '@/components/ui/table';
import { TTableColumn } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { APP_CONFIG } from '@/configs/app.config';
import { AddressDisplay, Chip } from '@/components/shared';
import { ROUTES } from '@/configs/routes.config';
import { Button } from '@/components/ui/button';
import { Countdown } from '../shared/count-down';
import { NumberUtil } from '@/utils';
import { getOrderStatusInfo } from '../../util';

interface P2POrdersListProps {
  orders: P2POrder[] | undefined;
  isLoading?: boolean;
}

export const P2POrdersList = ({ orders, isLoading }: P2POrdersListProps) => {
  const router = useRouter();
  const columns: TTableColumn<P2POrder>[] = [
    {
      headerContent: 'ORDER ID',
      renderCell: (order) => <p className="truncate text-sm font-medium">#{order.order_id}</p>,
      skeletonContent: <Skeleton className="h-3 w-24" />,
      align: 'center',
    },
    {
      headerContent: 'OFFER ID',
      renderCell: (order) => <p className="truncate text-sm">#{order.offer_id}</p>,
      skeletonContent: <Skeleton className="h-3 w-24" />,
      align: 'center',
    },
    {
      headerContent: 'SELLER',
      renderCell: (order) => (
        <AddressDisplay
          addressClassName="text-brand-primary"
          address={order.seller_wallet_address}
          href={ROUTES.WALLET(order.seller_wallet_address)}
        />
      ),
      skeletonContent: <Skeleton className="h-3 w-24" />,
      align: 'left',
    },
    {
      headerContent: 'BUYER',
      renderCell: (order) => (
        <AddressDisplay address={order.buyer_wallet_address} href={ROUTES.WALLET(order.buyer_wallet_address)} />
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
              1 {APP_CONFIG.CHAIN_SYMBOL} = {NumberUtil.formatWithCommas(order.price_rate)} VND
            </span>
          </div>
        </div>
      ),
      skeletonContent: <Skeleton className="h-6 w-24" />,
      align: 'left',
    },
    {
      headerContent: 'AMOUNT/TOTAL AMOUNT',
      renderCell: (order) => (
        <div className="text-sm">
          <p className="text-utility-success-600 text-left font-bold">
            {new Intl.NumberFormat('en-US').format(Number(order.amount))} {APP_CONFIG.CHAIN_SYMBOL}
          </p>
          <p className="text-muted-foreground text-left text-xs">
            {new Intl.NumberFormat('en-US').format(Number(order.amount * order.price_rate))} VND
          </p>
        </div>
      ),
      skeletonContent: <Skeleton className="h-3 w-24" />,
      align: 'left',
    },

    {
      headerContent: 'STATUS',
      renderCell: (order) => (
        <div className="flex items-center gap-2">
          <Chip variant={getOrderStatusInfo(order.status)} className="gap-1.5 rounded-sm">
            <span>{order.status}</span>
          </Chip>
        </div>
      ),
      skeletonContent: <Skeleton className="h-3 w-24" />,
      align: 'center',
    },
    {
      headerContent: 'TIME REMAINING',
      renderCell: (order) => (order.status === 'COMPLETED' ? null : <Countdown expiresAt={order.expires_at} />),
      skeletonContent: <Skeleton className="h-3 w-24" />,
      align: 'center',
    },
    {
      headerContent: 'ACTION',
      renderCell: (order) => (
        <Button
          className="bg-primary/10 text-brand-primary dark:hover:bg-brand-primary dark:bg-brand-primary/10 dark:border-brand-primary dark:text-primary-light inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition hover:text-white dark:border dark:hover:text-white"
          onClick={() => router.push(ROUTES.P2P_TRADING_ROOM(order.order_id.toString()))}
        >
          View
        </Button>
      ),
      skeletonContent: <Skeleton className="h-3 w-24" />,
      align: 'center',
    },
  ];
  return (
    <Card className="bg-card overflow-hidden border-gray-300 dark:border-gray-800">
      <div className="overflow-x-auto">
        <Table<P2POrder>
          columns={columns}
          rows={orders}
          isLoading={isLoading}
          classNameLayout="rounded-xl"
          nullDataContext="No trading activities match your filters"
        />
      </div>
    </Card>
  );
};
