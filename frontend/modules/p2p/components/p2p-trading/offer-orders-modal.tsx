'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { P2POffer, P2POrder, TradeTypes } from '../../types';
import { useEffect, useState } from 'react';
import { P2PService } from '../../api';
import { NumberUtil } from '@/utils';
import BigNumber from 'bignumber.js';
import { AddressDisplay, Chip } from '@/components/shared';
import { ROUTES } from '@/configs/routes.config';
import { getOrderStatusInfo } from '../../util';
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
                    address={order.buyer_wallet_address || ''}
                    href={ROUTES.WALLET(order.buyer_wallet_address || '')}
                    addressClassName="text-emerald-500 font-medium"
                />
            ),
            skeletonContent: <Skeleton className="h-4 w-24" />,
            align: 'left',
        },
        {
            headerContent: 'AMOUNT',
            renderCell: (order) => {
                const amount = NumberUtil.scaleDownBigNumber(new BigNumber(order.amount));
                const payable = order.payable_amount ? NumberUtil.scaleDownBigNumber(new BigNumber(order.payable_amount)) : amount.multipliedBy(offer.price_rate);

                return (
                    <div className="flex flex-col">
                        <div className="flex items-center gap-1 font-bold text-white">
                            <span>{amount.toFormat()} đồng</span>
                            <span className="text-gray-500 text-xs font-normal">→ {payable.toFormat()}</span>
                        </div>
                        <span className="text-[10px] text-gray-500 font-bold uppercase">VND</span>
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
                    className="rounded-full px-3 py-0.5 text-[10px] font-bold border-1"
                >
                    {order.status}
                </Chip>
            ),
            skeletonContent: <Skeleton className="h-5 w-20 rounded-full" />,
            align: 'right',
        },
        {
            headerContent: 'ACTION',
            renderCell: (order) => (
                <Button
                    className="h-8 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all text-[11px] font-bold uppercase tracking-wider"
                    onClick={() => router.push(ROUTES.P2P_TRADING_ROOM(order.order_id.toString()))}
                >
                    View
                </Button>
            ),
            skeletonContent: <Skeleton className="h-8 w-16 rounded-lg" />,
            align: 'right',
        },
    ];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl border-gray-800 bg-[#0B0F1A] text-white p-6 gap-0">
                <DialogHeader className="mb-4 md:mb-6">
                    <div className="flex items-center gap-3">
                        <DialogTitle className="text-lg md:text-2xl font-bold tracking-tight">Offer #{offer.offer_id}</DialogTitle>
                        <Chip
                            variant={offer.side === TradeTypes.SELL ? 'error' : 'success'}
                            className="rounded-full px-3 py-0.5 text-[10px] font-black border-1"
                        >
                            {offer.side}
                        </Chip>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">
                        Partial fills + cancellations. Use this to diagnose disputes.
                    </p>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-3 md:gap-4 mb-6 md:mb-8">
                    <div className="bg-gray-900/40 border border-gray-800/50 p-3 md:p-5 rounded-2xl md:rounded-3xl">
                        <p className="text-[8px] md:text-[10px] text-gray-500 font-black uppercase tracking-[0.1em] mb-1 md:mb-2">TOTAL</p>
                        <p className="text-lg md:text-2xl font-black text-white">{total.toFormat()} đồng</p>
                    </div>
                    <div className="bg-gray-900/40 border border-gray-800/50 p-3 md:p-5 rounded-2xl md:rounded-3xl">
                        <p className="text-[8px] md:text-[10px] text-gray-500 font-black uppercase tracking-[0.1em] mb-1 md:mb-2">REMAINING</p>
                        <p className="text-lg md:text-2xl font-black text-white">{available.toFormat()} đồng</p>
                    </div>
                </div>

                <div className="relative overflow-x-auto pb-2 scrollbar-hide">
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
