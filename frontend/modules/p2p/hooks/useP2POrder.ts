import { useEffect, useState } from 'react';
import { P2PService } from '../api';
import { P2POrder } from '../types/p2p.types';

export const useP2POrder = (orderId: string) => {
  const [order, setOrder] = useState<P2POrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchOrder = async () => {
      if (!orderId) {
        setIsLoading(false);
        setOrder(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const data = await P2PService.getOrderById(orderId);
        if (isMounted) {
          setOrder(data);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching P2P order:', err);
          setError('Không thể tải thông tin order. Vui lòng thử lại sau.');
          setOrder(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchOrder();

    return () => {
      isMounted = false;
    };
  }, [orderId]);

  const updateOrderStatus = (status: P2POrder['status']) => {
    if (order) {
      setOrder({ ...order, status });
    }
  };

  return { order, isLoading, error, updateOrderStatus };
};

