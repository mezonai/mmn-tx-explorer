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

  // Calculate values from order fields
  const amountVND = order.payable_amount || order.price || 0; // payable_amount is in VND (smallest unit)
  const amountMZD = order.amount; // amount is in MZD (smallest unit)
  const exchangeRate = useMemo(() => {
    if (amountMZD > 0) {
      return amountVND / amountMZD;
    }
    return offer?.price_rate || 0;
  }, [amountMZD, amountVND, offer?.price_rate]);

  return (
    <Card className="bg-card mb-6 rounded-xl border border-gray-800 p-6 shadow-lg">
      <div className="mb-1 text-sm text-gray-400">Amount to pay</div>
      <div className="mb-4 text-3xl font-bold tracking-wide text-green-400">
        {amountVND.toLocaleString('vi-VN')} VND
      </div>

      <div className="flex items-center justify-between border-t border-gray-800 py-3 text-sm">
        <span className="text-gray-400">Exchange rate</span>
        <span className="rounded bg-gray-800 px-2 py-1 text-xs text-gray-300">
          1 MZD = {exchangeRate.toLocaleString('vi-VN')} VND
        </span>
      </div>

      <div className="flex items-center justify-between border-t border-gray-800 py-3 text-sm">
        <span className="text-gray-400">MZD you will receive</span>
        <span className="brand-primary text-xl font-bold">{amountMZD.toLocaleString('vi-VN')} MZD</span>
      </div>
    </Card>
  );
};
