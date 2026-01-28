'use client';

import { useState } from 'react';
import { useUser } from '@/providers/AppProvider';
import { P2PService } from '../api';
import { P2POrder, P2POffer } from '../types';
import { toast } from 'sonner';
export const useCreateOrder = () => {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);

  const createOrder = async (offer: P2POffer, amountMZD: number, payableAmount: number): Promise<P2POrder | null> => {
    if (!user?.walletAddress) {
      throw new Error('User wallet not available');
    }
    setIsLoading(true);
    try {
      const order = await P2PService.createOrder(offer.offer_id, {
        amount: amountMZD,
      });
      return order;
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Failed to create order. Please try again later';
      toast.error('Order Creation Failed', {
        description: errorMessage,
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return { createOrder, isLoading };
};