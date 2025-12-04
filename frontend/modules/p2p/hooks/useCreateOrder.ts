import { useState } from 'react';
import { P2POrder, P2POffer } from '../types/p2p.types';
import { useUser } from '@/providers/AppProvider';
import { P2PService } from '../api';

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
      // Call Mock API layer (sau này sẽ được thay bằng BE thật)
      const order = await P2PService.createOrder({
        offerId: offer.id,
        amountMZD,
        amountVND,
      });

      // Ở mock hiện tại buyerId đang là mock_buyer_id.
      // Nếu muốn phản ánh đúng user hiện tại trên FE trong khi chưa có BE,
      // ta có thể override tạm buyerId tại đây.
      const normalizedOrder: P2POrder = {
        ...order,
        buyerId: user.id,
      };

      return normalizedOrder;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return { createOrder, isLoading };
};
