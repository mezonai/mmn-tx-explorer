'use client';

import { useState } from 'react';
import { useUser } from '@/providers/AppProvider';
import { P2PService } from '../api';
import { P2POrder, P2POffer } from '../types';

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

      console.log('📤 [useCreateOrder] Calling P2PService.createOrder with:', {
        offer_id: offer.offer_id,
        amount: amountMZD,
        price: price,
        calculated_from: amountVND ? 'amountVND' : 'amountMZD * price_rate',
      });

      const order = await P2PService.createOrder({
        offer_id: offer.offer_id,
        amount: amountMZD,
        price: price,
      });

      console.log('📥 [useCreateOrder] API Response received:', {
        order_id: order.order_id,
        status: order.status,
        offer_id: order.offer_id,
        amount: order.amount,
        payable_amount: order.payable_amount,
        price: order.price,
        buyer_wallet_address: order.buyer_wallet_address,
        seller_wallet_address: order.seller_wallet_address,
        expires_at: order.expires_at,
        created_at: order.created_at,
        full_response: order,
      });

      return order;
    } catch (error) {
      console.error('❌ [useCreateOrder] Error in createOrder:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return { createOrder, isLoading };
};
