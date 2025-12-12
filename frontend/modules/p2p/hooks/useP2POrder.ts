import { useEffect, useState } from 'react';
import { P2PService } from '../api';
import { P2POrder } from '../types';
import { useWebSocket, WebSocketEvent } from '@/lib/websocket';

export const useP2POrder = (orderId: string) => {
  const [order, setOrder] = useState<P2POrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const wsManager = useWebSocket();

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

  const updateOrderStatus = async (status: string, transferCode?: string) => {
    if (!order) return;

    const prevOrder = order;
    try {
      // Optimistic update
      setOrder({ ...order, status: status });
      if (transferCode) {
        setOrder({ ...order, status: status, transfer_code: transferCode });
      }

      // Call API
      const orderIdStr = String(order.order_id);
      const updated = await P2PService.updateOrderStatus(orderIdStr, status, transferCode);
      setOrder(updated);
    } catch (err) {
      // Revert on error
      setOrder(prevOrder);
      throw err;
    }
  };

  // Listen for order status updates via WebSocket
  useEffect(() => {
    if (!orderId || !wsManager) return;

    const handleStatusUpdate = (event: WebSocketEvent) => {
      const payload = event.payload as Record<string, unknown> | undefined;
      const payloadOrderId = (payload?.['order_id'] || payload?.['orderId']) as string | number | undefined;
      const orderIdStr = String(orderId);
      const payloadOrderIdStr = payloadOrderId ? String(payloadOrderId) : undefined;
      if (event.type !== 'ORDER_STATUS_UPDATED' || !payloadOrderIdStr || payloadOrderIdStr !== orderIdStr) {
        return;
      }

      const statusRaw = payload?.['status'] || payload?.['status'];
      const status = typeof statusRaw === 'string' ? statusRaw : undefined;
      if (!status) return;

      setOrder((current) => (current ? { ...current, status: status } : current));
    };

    wsManager.on('ORDER_STATUS_UPDATED', handleStatusUpdate);

    return () => {
      wsManager.off('ORDER_STATUS_UPDATED', handleStatusUpdate);
    };
  }, [orderId, wsManager]);

  return { order, isLoading, error, updateOrderStatus };
};
