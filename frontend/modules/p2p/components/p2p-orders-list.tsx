'use client';

import { useP2POrders } from '../hooks/useP2POrders';
import { OrderRow } from './order-row';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { P2POrder } from '../types/p2p.types';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/configs/routes.config';

export const P2POrdersList = () => {
  const { orders, isLoading } = useP2POrders();
  const router = useRouter();

  const handleOpenToConfirm = (order: P2POrder) => {
    router.push(ROUTES.P2P_TRADING(order.orderId));
  };

  if (isLoading) {
    return (
      <Card className="bg-card overflow-hidden border-gray-300 dark:border-gray-800">
        <div className="space-y-4 p-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </Card>
    );
  }

  if (orders.length === 0) {
    return (
      <Card className="bg-card overflow-hidden border-gray-300 dark:border-gray-800">
        <div className="p-12 text-center">
          <p className="lg text-gray-400">Bạn chưa có đơn hàng nào</p>
          <p className="mt-2 text-sm text-gray-500">Các đơn hàng của bạn sẽ hiển thị ở đây</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-card overflow-hidden border-gray-300 dark:border-gray-800">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead className="xs bg-gray-900 text-xs font-medium text-gray-400 uppercase">
            <tr>
              <th className="px-6 py-4">Order ID</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Wallets</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Time Remaining</th>
              <th className="px-6 py-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800 text-sm">
            {orders.map((order) => (
              <OrderRow key={order.orderId} order={order} onOpenToConfirm={handleOpenToConfirm} />
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
