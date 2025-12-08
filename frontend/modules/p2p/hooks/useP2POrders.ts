import { useCallback, useEffect, useState } from 'react';
import { useUser } from '@/providers/AppProvider';
import { P2PService } from '../api';
import { P2POrder } from '../types/p2p.types';
import { useWebSocket, WebSocketEvent } from '@/lib/websocket';

export const useP2POrders = () => {
  const { user } = useUser();
  const [orders, setOrders] = useState<P2POrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const wsManager = useWebSocket(); // Initialize WebSocket connection

  const fetchOrders = useCallback(async () => {
    if (!user?.id) {
      setOrders([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await P2PService.getMyOrders();
      setOrders(data);
    } catch (err) {
      console.error('Error fetching P2P orders:', err);
      setError('Không thể tải danh sách đơn hàng. Vui lòng thử lại sau.');
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      fetchOrders();
    } else {
      setOrders([]);
      setIsLoading(false);
    }
  }, [user?.id, fetchOrders]);

  // Listen for CREATE_ORDER events from WebSocket
  useEffect(() => {
    if (!user?.walletAddress || !wsManager) {
      return;
    }

    const handleCreateOrder = (event: WebSocketEvent) => {
      console.log('📦 Received CREATE_ORDER event:', event);

      // Parse payload if it's a string
      let orderData: Record<string, unknown>;
      try {
        orderData =
          typeof event.payload === 'string'
            ? (JSON.parse(event.payload) as Record<string, unknown>)
            : (event.payload as Record<string, unknown>);
      } catch (error) {
        console.error('Error parsing event payload:', error);
        return;
      }

      // Check if this order is for the current user (seller)
      // Seller received a new order
      const newOrder: P2POrder = {
        orderId: (orderData.orderId || orderData.order_id) as string,
        offerId: (orderData.offerId || orderData.offer_id) as string,
        amountMZD: (orderData.amountMZD || orderData.amount_mzd) as number,
        amountVND: (orderData.amountVND || orderData.amount_vnd) as number,
        exchangeRate: (orderData.exchangeRate || orderData.exchange_rate) as number,
        status: (orderData.status || 'PAYMENT_PENDING') as P2POrder['status'],
        createdAt: (orderData.createdAt || orderData.created_at || new Date().toISOString()) as string,
        expiresAt: (orderData.expiresAt ||
          orderData.expires_at ||
          new Date(Date.now() + 15 * 60 * 1000).toISOString()) as string,
      };

      // Add new order to the beginning of the list
      setOrders((prev) => [newOrder, ...prev]);
      console.log('✅ New order added to list:', newOrder);
    };

    // Register event listener
    wsManager.on('CREATE_ORDER', handleCreateOrder);

    // Cleanup listener on unmount or when user changes
    return () => {
      wsManager.off('CREATE_ORDER', handleCreateOrder);
    };
  }, [user?.walletAddress, wsManager]);

  const refetch = useCallback(() => {
    fetchOrders();
  }, [fetchOrders]);

  return { orders, isLoading, error, refetch };
};
