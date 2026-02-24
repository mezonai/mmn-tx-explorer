'use client';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { P2POrder, TradeTypes } from '../../types';
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
import { useUser } from '@/providers/AppProvider';

interface P2POrdersListProps {
  orders: P2POrder[] | undefined;
  isLoading?: boolean;
}

export const P2POrdersList = ({ orders, isLoading }: P2POrdersListProps) => {
  const router = useRouter();
  const { user } = useUser();
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
      headerContent: 'OFFER TYPE',
      renderCell: (order) => (
        <Chip
          variant={order.side === TradeTypes.BUY ? 'outline-info' : 'outline-success'}
          className="rounded-sm px-3 uppercase text-[10px] min-w-[60px] justify-center"
        >
          {order.side}
        </Chip>
      ),
      skeletonContent: <Skeleton className="h-3 w-16" />,
      align: 'center',
    },
    {
      headerContent: 'YOUR ROLE',
      renderCell: (order) => {
        const isOrderCreator = user?.walletAddress === order.order_creator_wallet_address;
        const role = isOrderCreator
          ? order.side === TradeTypes.SELL
            ? 'Seller'
            : 'Buyer'
          : order.side === TradeTypes.BUY
            ? 'Buyer'
            : 'Seller';

        const isActualBuyer = role === 'Buyer';

        return (
          <Chip
            variant={isActualBuyer ? 'outline-success' : 'outline-info'}
            className="rounded-sm px-3 text-[10px] min-w-[60px] justify-center"
          >
            {role}
          </Chip>
        );
      },
      skeletonContent: <Skeleton className="h-3 w-16" />,
      align: 'center',
    },
    {
      headerContent: 'COUNTERPARTY',
      renderCell: (order) => {
        const isOrderCreator = user?.walletAddress === order.order_creator_wallet_address;
        const counterpartyAddress = isOrderCreator ? order.offer_creator_wallet_address : order.order_creator_wallet_address;
        return (
          <AddressDisplay
            addressClassName="text-brand-primary"
            address={counterpartyAddress}
            href={ROUTES.WALLET(counterpartyAddress)}
          />
        );
      },
      skeletonContent: <Skeleton className="h-3 w-24" />,
      align: 'left',
    },
    {
      headerContent: 'AMOUNT',
      renderCell: (order) => {
        const isOrderCreator = user?.walletAddress === order.order_creator_wallet_address;
        const role = isOrderCreator
          ? order.side === TradeTypes.SELL
            ? 'Seller'
            : 'Buyer'
          : order.side === TradeTypes.BUY
            ? 'Buyer'
            : 'Seller';

        const isActualBuyer = role === 'Buyer';

        const amount = NumberUtil.scaleDownBigIntString(order.amount);
        const vndAmount = amount.multipliedBy(order.price_rate);

        return (
          <div className="text-sm">
            <p className="text-utility-success-600 text-left font-bold">
              {amount.toFormat()} {APP_CONFIG.CHAIN_SYMBOL}
            </p>
            <p className="text-muted-foreground text-left text-[11px]">
              {isActualBuyer ? 'You pay' : 'You receive'} {vndAmount.toFormat()} VND
            </p>
          </div>
        );
      },
      skeletonContent: <Skeleton className="h-3 w-24" />,
      align: 'left',
    },
    {
      headerContent: 'STATUS',
      renderCell: (order) => (
        <div className="flex items-center gap-2">
          <Chip
            variant={getOrderStatusInfo(order.status)}
            className="gap-1.5 rounded-sm px-3 text-[10px] min-w-[80px] justify-center"
          >
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
