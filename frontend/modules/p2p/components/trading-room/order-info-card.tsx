'use client';

import { Card } from '@/components/ui/card';
import { P2POrder } from '../../types';
import { useP2POffer } from '../../hooks/useP2POffer';
import { APP_CONFIG } from '@/configs/app.config';
import { formatCurrency } from '@/modules/p2p/util';

interface OrderInfoCardProps {
  order: P2POrder;
}

export const OrderInfoCard = ({ order }: OrderInfoCardProps) => {
  const { offer } = useP2POffer(String(order.offer_id));
  const priceRate = offer?.price_rate || 0;
  const amountVND = priceRate > 0 ? priceRate * order.amount : 0;

  return (
    <Card className="bg-card rounded-lg border border-border p-3 shadow-lg mb-3">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Amount to pay</span>
          <span className="text-xl font-bold text-green-400">
            {formatCurrency(amountVND)} <span className="text-xs">VND</span>
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Exchange rate</span>
          <span className="text-brand-primary text-sm font-semibold">
            1 {APP_CONFIG.CHAIN_SYMBOL} = {formatCurrency(order.price_rate)} VND
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">You will receive</span>
          <span className="brand-primary text-sm font-semibold">
            {order.amount} <span className="">{APP_CONFIG.CHAIN_SYMBOL}</span>
          </span>
        </div>
      </div>
    </Card>
  );
};