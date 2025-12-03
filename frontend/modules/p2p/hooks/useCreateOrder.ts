import { useState } from 'react';
import { P2POrder, P2POffer } from '../types/p2p.types';
import { useUser } from '@/providers/AppProvider';

export const useCreateOrder = () => {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);

  const createOrder = async (
    offer: P2POffer,
    amountMZD: number,
    amountVND: number
  ): Promise<P2POrder | null> => {
    if (!user?.id) {
      throw new Error('User not logged in');
    }

    setIsLoading(true);

    try {
      // TODO: Call API to create order
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Generate order ID
      const orderId = `order_${offer.id}_${Date.now()}`;

      // Generate transfer code
      const transferCode = `MZD ${Math.floor(Math.random() * 100000)}`;

      const newOrder: P2POrder = {
        id: orderId,
        offerId: offer.id,
        buyerId: user.id,
        sellerId: offer.advertiser.id,
        sellerUsername: offer.advertiser.username,
        amountMZD,
        amountVND,
        exchangeRate: offer.exchangeRate,
        status: 'PAYMENT_PENDING',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
        transferCode,
        bankInfo: offer.bankInfo || {
          bank: 'MB',
          accountNumber: '0000000000',
          accountName: offer.advertiser.username,
        },
      };

      // TODO: Save to backend
      // For now, we'll return the order and let the caller handle navigation

      return newOrder;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return { createOrder, isLoading };
};


