'use client';

import { Card } from '@/components/ui/card';
import { P2POrder } from '../../types';
import { useP2POffer } from '../../hooks/useP2POffer';
import { useMemo } from 'react';

interface OrderInfoCardProps {
  order: P2POrder;
}

export const OrderInfoCard = ({ order }: OrderInfoCardProps) => {
  const { offer } = useP2POffer(String(order.offer_id));
  return (
    <Card className="bg-card mb-4 rounded-lg border border-border p-4 shadow-lg">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-muted-foreground mb-1">Amount to pay</span>
        <span className="text-2xl font-bold text-green-400">
          {order.payable_amount} <span className="text-sm">VND</span>
        </span>
      </div>

      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-muted-foreground">Exchange rate</span>
        <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
          1 MZD = {order.price_rate} VND
        </span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">MZD you will receive</span>
        <span className="brand-primary text-lg font-bold">
          {order.amount} <span className="text-xs">MZD</span>
        </span>
      </div>
    </Card>
  );
};