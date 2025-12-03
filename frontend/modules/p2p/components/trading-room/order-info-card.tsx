'use client';

import { Card } from '@/components/ui/card';
import { P2POrder } from '../../types/p2p.types';

interface OrderInfoCardProps {
  order: P2POrder;
}

export const OrderInfoCard = ({ order }: OrderInfoCardProps) => {
  return (
    <Card className="bg-card rounded-xl p-6 mb-6 border border-gray-800 shadow-lg">
      <div className="text-gray-400 text-sm mb-1">Số tiền cần thanh toán</div>
      <div className="text-3xl font-bold text-green-400 mb-4 tracking-wide">
        {order.amountVND.toLocaleString('vi-VN')} VND
      </div>

      <div className="flex justify-between items-center text-sm py-3 border-t border-gray-800">
        <span className="text-gray-400">Tỷ giá</span>
        <span className="bg-gray-800 px-2 py-1 rounded text-xs text-gray-300">
          1 MZD = {order.exchangeRate.toLocaleString('vi-VN')} VND
        </span>
      </div>

      <div className="flex justify-between items-center text-sm py-3 border-t border-gray-800">
        <span className="text-gray-400">Số lượng MZD sẽ nhận</span>
        <span className="text-brand-primary font-bold text-xl">
          {order.amountMZD.toLocaleString('vi-VN')} MZD
        </span>
      </div>
    </Card>
  );
};




