'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { P2POffer, P2POrder, TradeTypes } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { P2PService } from '../../api';
import { NumberUtil } from '@/utils';
import BigNumber from 'bignumber.js';
import { AddressDisplay, Chip } from '@/components/shared';
import { ROUTES } from '@/configs/routes.config';
import { getOrderStatusInfo, getOrderStatusLabel } from '../../util';
import { Skeleton } from '@/components/ui/skeleton';
import { Table } from '@/components/ui/table';
import { TTableColumn } from '@/types';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface OfferOrdersModalProps {
  offer: P2POffer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const OfferOrdersModal = ({ offer, open, onOpenChange }: OfferOrdersModalProps) => {
  const router = useRouter();
  const [orders, setOrders] = useState<P2POrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open && offer) {
      setIsLoading(true);
      P2PService.getOrdersByOffer(offer.offer_id)
        .then((data) => {
          setOrders(data);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [open, offer]);

  if (!offer) return null;

  const total = NumberUtil.scaleDownBigNumber(new BigNumber(offer.total_amount));
  const available = NumberUtil.scaleDownBigNumber(new BigNumber(offer.amount));

  const columns: TTableColumn<P2POrder>[] = [
    {
      headerContent: 'ORDER',
      renderCell: (order) => <span className="text-sm font-bold text-gray-300">#{order.order_id}</span>,
      skeletonContent: <Skeleton className="h-4 w-12" />,
      align: 'left',
    },
    {
      headerContent: 'COUNTERPARTY',
      renderCell: (order) => (
        <AddressDisplay
          address={order.order_creator_wallet_address || ''}
          href={ROUTES.WALLET(order.order_creator_wallet_address || '')}
          addressClassName="text-brand-primary font-medium"
        />
      ),
      skeletonContent: <Skeleton className="h-4 w-24" />,
      align: 'left',
    },
    {
      headerContent: 'AMOUNT',
      renderCell: (order) => {
        const amount = NumberUtil.scaleDownBigNumber(new BigNumber(order.amount));
        const payable = order.payable_amount
          ? new BigNumber(order.payable_amount)
          : amount.multipliedBy(offer.price_rate);

        return (
          <div className="flex items-center">
            <div className="flex items-center gap-1 font-bold whitespace-nowrap text-white">
              <span>{amount.toFormat()} đồng</span>
              <span className="text-xs font-normal text-gray-500">
                → {payable.toFormat()} <span className="text-[10px] font-bold text-gray-500 uppercase">VND</span>
              </span>
            </div>
          </div>
        );
      },
      skeletonContent: <Skeleton className="h-4 w-20" />,
      align: 'left',
    },
    {
      headerContent: 'STATUS',
      renderCell: (order) => (
        <Chip
          variant={getOrderStatusInfo(order.status)}
          className="rounded-full border-1 px-3 py-0.5 text-[10px] font-bold"
        >
          {getOrderStatusLabel(order.status)}
        </Chip>
      ),
      skeletonContent: <Skeleton className="h-5 w-20 rounded-full" />,
      align: 'center',
    },
    {
      headerContent: 'ACTION',
      renderCell: (order) => (
        <Button
          className="h-8 rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-[11px] font-bold tracking-wider text-emerald-500 uppercase transition-all hover:bg-emerald-500 hover:text-white"
          onClick={() => router.push(ROUTES.P2P_TRADING_ROOM(order.order_id.toString()))}
        >
          View
        </Button>
      ),
      skeletonContent: <Skeleton className="h-8 w-16 rounded-lg" />,
      align: 'center',
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl gap-0 border-gray-800 p-6 text-white">
        <DialogHeader className="mb-4 md:mb-6">
          <div className="flex items-center gap-3">
            <DialogTitle className="text-card-foreground text-lg font-bold tracking-tight md:text-2xl">
              Offer #{offer.offer_id}
            </DialogTitle>
            <Chip variant={offer.side === TradeTypes.SELL ? 'error' : 'success'}>{offer.side}</Chip>
          </div>
          <p className="mt-1 text-sm text-gray-400">Partial fills + cancellations. Use this to diagnose disputes.</p>
        </DialogHeader>

        <div className="mb-6 grid grid-cols-2 gap-3 md:mb-8 md:gap-4">
          <Card className="dark:border-primary/20">
            <CardContent>
              <CardHeader className="flex items-center justify-between gap-2 p-0">
                <CardTitle className="mb-1 text-[10px] font-black tracking-[0.1em] text-gray-500 uppercase">
                  TOTAL
                </CardTitle>
              </CardHeader>
              <p className="text-card-foreground text-lg font-black md:text-2xl">{total.toFormat()} đồng</p>
            </CardContent>
          </Card>
          <Card className="dark:border-primary/20">
            <CardContent>
              <CardHeader className="flex items-center justify-between gap-2 p-0">
                <CardTitle className="mb-1 text-[10px] font-black tracking-[0.1em] text-gray-500 uppercase">
                  REMAINING
                </CardTitle>
              </CardHeader>
              <p className="text-card-foreground text-lg font-black md:text-2xl">{available.toFormat()} đồng</p>
            </CardContent>
          </Card>
        </div>

        <div className="scrollbar-hide relative overflow-x-auto pb-2">
          <div className="min-w-[600px] lg:min-w-full">
            <Table<P2POrder>
              columns={columns}
              rows={orders}
              isLoading={isLoading}
              getRowKey={(r) => r.order_id}
              classNameLayout="border-none bg-transparent"
              nullDataContext="No orders found for this offer"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
