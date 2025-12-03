import { useState, useEffect, useCallback } from 'react';
import { P2POrder } from '../types/p2p.types';
import { useUser } from '@/providers/AppProvider';

// Helper function to generate mock orders for a specific seller
const generateMockOrders = (sellerId: string, sellerUsername: string): P2POrder[] => [
  {
    id: '19283746',
    offerId: '1',
    buyerId: 'buyer1',
    sellerId,
    sellerUsername,
    amountMZD: 2545000,
    amountVND: 2545000,
    exchangeRate: 1.0,
    status: 'PAYMENT_PENDING',
    createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    transferCode: 'MZD 83729',
    bankInfo: {
      bank: 'TCB',
      accountNumber: '19034482991022',
      accountName: 'NGUYEN VAN A',
    },
  },
  {
    id: '19283747',
    offerId: '2',
    buyerId: 'buyer2',
    sellerId,
    sellerUsername,
    amountMZD: 1000000,
    amountVND: 1000000,
    exchangeRate: 1.0,
    status: 'WAIT_CONFIRM',
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    transferCode: 'MZD 83730',
    bankInfo: {
      bank: 'VCB',
      accountNumber: '1234567890',
      accountName: 'TRAN VAN B',
    },
  },
];

export const useP2POrders = () => {
  const { user } = useUser();
  const [orders, setOrders] = useState<P2POrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch orders (mock API call)
  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      if (user?.id) {
        // Generate mock orders với sellerId = current user.id
        // Điều này cho phép test với bất kỳ user nào đang login
        const mockOrders = generateMockOrders(user.id, user.username || 'Current User');
        setOrders(mockOrders);
      } else {
        setOrders([]);
      }
      setIsLoading(false);
    }, 300);
  }, [user?.id, user?.username]);

  // Initial fetch
  useEffect(() => {
    if (user?.id) {
      fetchOrders();
    }
  }, [user?.id, fetchOrders]);

  const refetch = useCallback(() => {
    fetchOrders();
  }, [fetchOrders]);

  return { orders, isLoading, refetch };
};
