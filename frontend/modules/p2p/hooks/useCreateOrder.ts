'use client';

import { useState } from 'react';
import { useUser } from '@/providers/AppProvider';
import { P2PService } from '../api';
import { P2POrder, P2POffer } from '../types';
import { toast } from 'sonner';
export const useCreateOrder = () => {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);

  const createOrder = async (offer: P2POffer, amountMZD: number, amountVND?: number): Promise<P2POrder | null> => {
    if (!user?.walletAddress) {
      throw new Error('User wallet not available');
    }

    setIsLoading(true);

    try {
      // Calculate price from amountVND if not provided, or use offer price_rate
      const price = amountVND || amountMZD * offer.price_rate;

      const order = await P2PService.createOrder({
        offer_id: offer.offer_id,
        amount: amountMZD,
        price: price,
      });

      return order;
    } catch (error) {
      toast.error('Failed to create order', {
        description: 'Please try again later',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return { createOrder, isLoading };
};
