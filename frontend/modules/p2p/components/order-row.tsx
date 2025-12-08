'use client';

import { P2POrder } from '../types/p2p.types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/configs/routes.config';
import { cn } from '@/lib/utils';
import { Clock, CheckCircle2 } from 'lucide-react';
import { AddressDisplay } from '@/components/shared/address-display';

interface OrderRowProps {
  order: P2POrder;
  onOpenToConfirm?: (order: P2POrder) => void;
}

export const OrderRow = ({ order, onOpenToConfirm }: OrderRowProps) => {
  const router = useRouter();

  const handleRowClick = () => {
    router.push(ROUTES.P2P_TRADING(order.orderId));
  };

  const handleOpenToConfirm = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOpenToConfirm?.(order);
  };

  const getStatusBadge = (status: P2POrder['status']) => {
    switch (status) {
      case 'PAYMENT_PENDING':
        return (
          <Badge variant="outline" className="border-yellow-500 text-yellow-500">
            Chờ thanh toán
          </Badge>
        );
      case 'WAIT_CONFIRM':
        return (
          <Badge variant="outline" className="border-orange-500 text-orange-500">
            Chờ xác nhận
          </Badge>
        );
      case 'PAYMENT_CONFIRMED':
        return (
          <Badge variant="outline" className="border-blue-500 text-blue-500">
            Đã xác nhận
          </Badge>
        );
      case 'COMPLETED':
        return (
          <Badge variant="outline" className="border-emerald-500 text-emerald-500">
            Hoàn thành
          </Badge>
        );
      case 'CANCELLED':
        return (
          <Badge variant="outline" className="border-red-500 text-red-500">
            Đã hủy
          </Badge>
        );
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

  return (
    <tr
      onClick={handleRowClick}
      className={cn(
        'cursor-pointer transition-colors hover:bg-gray-800/50',
        order.status === 'WAIT_CONFIRM' && 'border-l-4 border-l-orange-500 bg-orange-500/10'
      )}
    >
      <td className="px-6 py-4">
        <div className="flex flex-col gap-1">
          <div className="font-medium text-white">#{order.orderId}</div>
          <div className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleString('vi-VN')}</div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-col gap-1">
          <div className="font-medium text-white">
            {order.amountMZD.toLocaleString('vi-VN')} <span className="text-xs text-gray-500">MZD</span>
          </div>
          <div className="text-xs text-gray-500">
            {order.amountVND.toLocaleString('vi-VN')} <span className="text-gray-400">VND</span>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-col gap-2">
          <div className="text-xs text-gray-500 uppercase">Seller wallet</div>
          <AddressDisplay address={order.sellerWalletAddress} href={ROUTES.WALLET(order.sellerWalletAddress)} />
          <div className="mt-2 text-xs text-gray-500 uppercase">Buyer wallet</div>
          <AddressDisplay address={order.buyerWalletAddress} href={ROUTES.WALLET(order.buyerWalletAddress)} />
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          {getStatusBadge(order.status)}
          {order.status === 'WAIT_CONFIRM' && (
            <span className="animate-pulse text-xs font-medium text-orange-500">New</span>
          )}
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Clock className="h-4 w-4" />
          <span>{formatTimeRemaining(order.expiresAt)}</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          {order.status === 'WAIT_CONFIRM' ? (
            <Button
              onClick={handleOpenToConfirm}
              className="bg-orange-500 font-medium text-white hover:bg-orange-600"
              size="sm"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
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
