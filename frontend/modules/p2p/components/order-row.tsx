'use client';

import { P2POrder } from '../types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/configs/routes.config';
import { cn } from '@/lib/utils';
import { Clock, CheckCircle2 } from 'lucide-react';
import { AddressDisplay } from '@/components/shared/address-display';
import { useP2POffer } from '../hooks/useP2POffer';
import { useMemo } from 'react';

interface OrderRowProps {
  order: P2POrder;
  onOpenToConfirm?: (order: P2POrder) => void;
}

export const OrderRow = ({ order, onOpenToConfirm }: OrderRowProps) => {
  const router = useRouter();
  const { offer } = useP2POffer(String(order.offer_id));

  const handleRowClick = () => {
    router.push(ROUTES.P2P_TRADING_ROOM(String(order.order_id)));
  };

  const handleOpenToConfirm = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOpenToConfirm?.(order);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <Badge variant="outline" className="text-yellow-500 border-yellow-500">Chờ thanh toán</Badge>;
      case 'PENDING':
        return <Badge variant="outline" className="text-yellow-500 border-yellow-500">Chờ thanh toán</Badge>;
      case 'CONFIRMED':
        return <Badge variant="outline" className="text-emerald-500 border-emerald-500">Hoàn thành</Badge>;
      case 'CANCELED':
        return <Badge variant="outline" className="text-red-500 border-red-500">Đã hủy</Badge>;
      case 'FAILED':
        return <Badge variant="outline" className="text-red-500 border-red-500">Lỗi</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();

    if (diff <= 0) return 'Đã hết hạn';

    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Calculate display values
  const amountMZD = order.amount;
  const amountVND = order.price;
  const sellerAddress = offer?.seller_wallet_address || '';

  return (
    <tr
      onClick={handleRowClick}
      className={cn(
        'cursor-pointer transition-colors hover:bg-gray-800/50',
        order.order_status === 'PENDING' && 'bg-orange-500/10 border-l-4 border-l-orange-500'
      )}
    >
      <td className="px-6 py-4">
        <div className="flex flex-col gap-1">
          <div className="font-medium text-white">#{order.order_id}</div>
          <div className="text-xs text-gray-500">
            {new Date(order.created_at).toLocaleString('vi-VN')}
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-col gap-1">
          <div className="font-medium text-white">
            {amountMZD.toLocaleString('vi-VN')} <span className="text-xs text-gray-500">MZD</span>
          </div>
          <div className="text-xs text-gray-500">
            {amountVND.toLocaleString('vi-VN')} <span className="text-gray-400">VND</span>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-col gap-2">
          {sellerAddress && (
            <>
              <div className="text-xs uppercase text-gray-500">Seller wallet</div>
              <AddressDisplay
                address={sellerAddress}
                href={ROUTES.WALLET(sellerAddress)}
              />
            </>
          )}
          <div className="text-xs uppercase text-gray-500 mt-2">Buyer wallet</div>
          <AddressDisplay
            address={order.buyer_wallet_address}
            href={ROUTES.WALLET(order.buyer_wallet_address)}
          />
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          {getStatusBadge(order.order_status)}
          {order.order_status === 'PENDING' && (
            <span className="text-xs text-orange-500 font-medium animate-pulse">New</span>
          )}
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Clock className="h-4 w-4" />
          <span>{formatTimeRemaining(order.expires_at)}</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          {order.order_status === 'PENDING' ? (
            <Button
              onClick={handleOpenToConfirm}
              className="bg-orange-500 hover:bg-orange-600 text-white font-medium"
              size="sm"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Open to confirm
            </Button>
          ) : (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                handleRowClick();
              }}
              variant="outline"
              size="sm"
            >
              View
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
};



