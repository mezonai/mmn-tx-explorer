'use client';

import { Card } from '@/components/ui/card';
import { P2POrder } from '../../types/p2p.types';

interface OrderInfoCardProps {
  order: P2POrder;
}

export const OrderInfoCard = ({ order }: OrderInfoCardProps) => {
  return (
    <Card className="bg-card mb-6 rounded-xl border border-gray-800 p-6 shadow-lg">
      <div className="mb-1 text-sm text-gray-400">Số tiền cần thanh toán</div>
      <div className="mb-4 text-3xl font-bold tracking-wide text-green-400">
        {order.amountVND.toLocaleString('vi-VN')} VND
      </div>

      <div className="flex items-center justify-between border-t border-gray-800 py-3 text-sm">
        <span className="text-gray-400">Tỷ giá</span>
        <span className="rounded bg-gray-800 px-2 py-1 text-xs text-gray-300">
          1 MZD = {order.exchangeRate.toLocaleString('vi-VN')} VND
        </span>
      </div>

      <div className="flex items-center justify-between border-t border-gray-800 py-3 text-sm">
        <span className="text-gray-400">Số lượng MZD sẽ nhận</span>
        <span className="brand-primary text-xl font-bold">{order.amountMZD.toLocaleString('vi-VN')} MZD</span>
      </div>
    </Card>
  );
};
