import { useState, useEffect } from 'react';
import { P2POrder } from '../types/p2p.types';

// Mock data - sẽ thay thế bằng API call sau
const mockOrder: P2POrder = {
  id: '19283746',
  offerId: '1',
  buyerId: 'buyer1',
  sellerId: 'user1',
  sellerUsername: 'Mezon_Trader_Pro',
  amountMZD: 2545000,
  amountVND: 2036000, // amountMZD * exchangeRate (2545000 * 0.8)
  exchangeRate: 0.8, // 1 MZD = 0.8 VND
  status: 'PAYMENT_PENDING',
  createdAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
  transferCode: 'MZD 83729',
  bankInfo: {
    bank: 'TCB',
    accountNumber: '19034482991022',
    accountName: 'NGUYEN VAN A',
  },
};

export const useP2POrder = (orderId: string) => {
  const [order, setOrder] = useState<P2POrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setOrder({ ...mockOrder, id: orderId });
      setIsLoading(false);
    }, 500);
  }, [orderId]);

  const updateOrderStatus = (status: P2POrder['status']) => {
    if (order) {
      setOrder({ ...order, status });
    }
  };

  return { order, isLoading, updateOrderStatus };
};
