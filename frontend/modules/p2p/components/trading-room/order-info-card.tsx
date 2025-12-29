'use client';

import { Card } from '@/components/ui/card';
import { P2POrder } from '../../types';
import { useP2POffer } from '../../hooks/useP2POffer';
import { APP_CONFIG } from '@/configs/app.config';

interface OrderInfoCardProps {
  order: P2POrder;
}

export const OrderInfoCard = ({ order }: OrderInfoCardProps) => {
  const { offer } = useP2POffer(String(order.offer_id));



  return (
    <Card className="bg-card mb-4 rounded-lg border border-border p-4 shadow-lg">
      <div className="flex items-center justify-between ">
        <span className="text-xs text-muted-foreground mb-1">Amount to pay</span>
        <span className="text-2xl font-bold text-green-400">
          {order.payable_amount} <span className="text-sm">VND</span>
        </span>
      </div>


      <div className="flex items-center justify-between ">
        <span className="text-xs text-muted-foreground">Exchange rate</span>
        <span className="text-brand-primary font-semibold">
          1 {APP_CONFIG.CHAIN_SYMBOL} = {order.price_rate.toLocaleString('vi-VN')} VND
        </span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">You will receive</span>
        <span className="brand-primary font-semibold">
          {order.amount} <span className="">{APP_CONFIG.CHAIN_SYMBOL}</span>
        </span>
      </div>
    </Card>
  );
};