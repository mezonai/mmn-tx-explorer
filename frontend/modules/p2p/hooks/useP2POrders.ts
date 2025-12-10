import { useCallback, useEffect, useState } from 'react';
import { useUser } from '@/providers/AppProvider';
import { P2PService } from '../api';
import { P2POrder } from '../types';
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
      const sellerAddress = (orderData.seller_wallet_address || orderData.sellerWalletAddress) as string | undefined;
      if (sellerAddress === user.walletAddress) {
        // Seller received a new order
        const newOrder: P2POrder = {
          order_id: (orderData.order_id || orderData.orderId) as string | number,
          offer_id: (orderData.offer_id || orderData.offerId) as string | number,
          buyer_wallet_address: (orderData.buyer_wallet_address || orderData.buyerWalletAddress) as string || '',
          amount: (orderData.amount || 0) as number,
          price: (orderData.price || 0) as number,
          order_status: (orderData.order_status || orderData.status || 'PENDING') as string,
          transfer_code: (orderData.transfer_code || orderData.transferCode) as string | null | undefined,
          expires_at: (orderData.expires_at || orderData.expiresAt || new Date(Date.now() + 15 * 60 * 1000).toISOString()) as string,
          created_at: (orderData.created_at || orderData.createdAt || new Date().toISOString()) as string,
          updated_at: (orderData.updated_at || orderData.updatedAt || new Date().toISOString()) as string,
        };

        // Add new order to the beginning of the list
        setOrders((prev) => [newOrder, ...prev]);
        console.log('✅ New order added to list:', newOrder);
      }
    };

    // Register event listener
    wsManager.on('CREATE_ORDER', handleCreateOrder);

    // Cleanup listener on unmount or when user changes
    return () => {
      wsManager.off('CREATE_ORDER', handleCreateOrder);
    };
  }, [user?.walletAddress, wsManager]);

  // Listen for ORDER_STATUS_UPDATED to keep My Orders in sync
  useEffect(() => {
    if (!user?.walletAddress || !wsManager) {
      return;
    }

    const handleStatusUpdate = (event: WebSocketEvent) => {
      if (event.type !== 'ORDER_STATUS_UPDATED') return;

      const payload = event.payload as Record<string, unknown> | undefined;
      const payloadOrderId = (payload?.['order_id'] || payload?.['orderId']) as string | number | undefined;
      const statusRaw = payload?.['order_status'] || payload?.['status'];
      const status = typeof statusRaw === 'string' ? statusRaw : undefined;

      if (!payloadOrderId || !status) return;

      // Update matching order in list
      setOrders((prev) =>
        prev.map((order) => {
          const orderIdStr = String(order.order_id);
          const payloadOrderIdStr = String(payloadOrderId);
          return orderIdStr === payloadOrderIdStr ? { ...order, order_status: status } : order;
        })
      );
    };

    wsManager.on('ORDER_STATUS_UPDATED', handleStatusUpdate);

    return () => {
      wsManager.off('ORDER_STATUS_UPDATED', handleStatusUpdate);
    };
  }, [user?.walletAddress, wsManager]);

  const refetch = useCallback(() => {
    fetchOrders();
  }, [fetchOrders]);

  return { orders, isLoading, error, refetch };
};
