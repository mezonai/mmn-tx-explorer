'use client';

import { useState } from 'react';
import { useUser } from '@/providers/AppProvider';
import { P2PService } from '../api';
import { P2POrder, P2POffer } from '../types/p2p.types';

export const useCreateOrder = () => {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);

  const createOrder = async (offer: P2POffer, amountMZD: number, amountVND?: number): Promise<P2POrder | null> => {
    if (!user?.walletAddress) {
      throw new Error('User wallet not available');
    }

    setIsLoading(true);

    try {
      const order = await P2PService.createOrder({
        offerId: offer.offerId,
        amountMZD,
        amountVND,
      });

      // Ensure buyer wallet reflects current user in mock mode
      return {
        ...order,
        buyerWalletAddress: user.walletAddress,
      };
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return { createOrder, isLoading };
};
