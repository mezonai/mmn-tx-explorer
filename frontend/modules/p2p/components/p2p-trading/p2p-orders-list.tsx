import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { OfferStatus, P2POrder } from '../../types';
import { Table } from '@/components/ui/table';
import { TTableColumn } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { APP_CONFIG } from '@/configs/app.config';
import { AddressDisplay, Chip } from '@/components/shared';
import { ROUTES } from '@/configs/routes.config';
import { Button } from '@/components/ui/button';
import { OFFERS_STATUS } from '../../constants';

interface P2POrdersListProps {
  orders: P2POrder[] | undefined;
  isLoading?: boolean;
}
const getTransactionTypeInfo = (type: OfferStatus) => {
  switch (type) {
    case OFFERS_STATUS.OPEN:
      return 'success';
    case OFFERS_STATUS.FAILED:
      return 'error';
    case OFFERS_STATUS.PENDING:
      return 'warning';
    case OFFERS_STATUS.CONFIRMED:
      return 'info';
    case OFFERS_STATUS.CANCELED:
      return 'brand';
    default:
      return 'default';
  }
};
export const P2POrdersList = ({ orders, isLoading }: P2POrdersListProps) => {
  const Countdown = ({ expiresAt }: { expiresAt?: string | number | Date }) => {
    const getMs = (v?: string | number | Date) => {
      if (!v) return 0;
      const d = typeof v === 'string' || typeof v === 'number' ? new Date(v) : v;
      const t = d instanceof Date && !isNaN(d.getTime()) ? d.getTime() : 0;
      return Math.max(0, t - Date.now());
    };

    const [remainingMs, setRemainingMs] = useState(() => getMs(expiresAt));

    useEffect(() => {
      setRemainingMs(getMs(expiresAt));
      const id = setInterval(() => {
        const ms = getMs(expiresAt);
        setRemainingMs(ms);
        if (ms <= 0) clearInterval(id);
      }, 1000);
      return () => clearInterval(id);
    }, [expiresAt]);

    const fmt = (ms: number) => {
      if (ms <= 0) return 'Expired!';
      const sec = Math.floor(ms / 1000);
      const days = Math.floor(sec / 86400);
      const hours = Math.floor((sec % 86400) / 3600);
      const minutes = Math.floor((sec % 3600) / 60);
      const seconds = sec % 60;
      if (days > 0) return `${days}d ${hours}h`;
      if (hours > 0) return `${hours}h ${minutes}m`;
      if (minutes > 0) return `${minutes}m ${seconds}s`;
      return `${seconds}s`;
    };

    const className = remainingMs <= 0 ? 'text-error-primary-600 font-bold' : 'text-utility-success-600 font-bold';

    return <p className={className}>{fmt(remainingMs)}</p>;
  };
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
              {order.price_rate.toLocaleString('vi-VN')} VND/{APP_CONFIG.CHAIN_SYMBOL}
            </span>
          </div>
        </div>
      ),
      skeletonContent: <Skeleton className="h-6 w-24" />,
      align: 'left',
    },
    {
      headerContent: 'AMOUNT',
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
          <Chip variant={getTransactionTypeInfo(order.status)} className="gap-1.5 rounded-sm">
            <span>{order.status}</span>
          </Chip>
        </div>
      ),
      skeletonContent: <Skeleton className="h-3 w-24" />,
      align: 'center',
    },
    {
      headerContent: 'TIME REMAINING',
      renderCell: (order) => <Countdown expiresAt={order.expires_at} />,
      skeletonContent: <Skeleton className="h-3 w-24" />,
      align: 'center',
    },
    {
      headerContent: 'ACTION',
      renderCell: (order) => (
        <Button
          className="bg-primary/10 text-brand-primary dark:hover:bg-brand-primary dark:bg-brand-primary/10 dark:border-brand-primary dark:text-primary-light inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition hover:text-white dark:border dark:hover:text-white"
          onClick={() => console.log('view', order.order_id)}
        >
          View
        </Button>
      ),
      skeletonContent: <Skeleton className="h-3 w-24" />,
      align: 'center',
    },
  ];
  console.log(orders);
  return (
    <Card className="bg-card overflow-hidden border-gray-300 dark:border-gray-800">
      <div className="overflow-x-auto">
        <Table<P2POrder>
          columns={columns}
          rows={orders}
          isLoading={isLoading}
          classNameLayout="rounded-xl"
          nullDataContext="No orders match your filters"
        />
      </div>
    </Card>
  );
};
