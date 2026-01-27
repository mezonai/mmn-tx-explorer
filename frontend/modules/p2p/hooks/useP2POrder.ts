import { useEffect, useState } from 'react';
import { P2PService } from '../api';
import { P2POrder, OrderStatus } from '../types';
import { P2P_EVENT_TYPES } from '../constants';
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
          setError('Unable to load order details. Please try again later.');
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

  const updateOrderStatus = async (status: OrderStatus | string, transferCode?: string) => {
    if (!order) return;

    const prevOrder = order;
    try {
      const optimisticUpdate: Partial<P2POrder> = { status: status as OrderStatus };
      if (transferCode) {
        optimisticUpdate.transfer_code = transferCode;
      }
      setOrder({ ...order, ...optimisticUpdate });

      const orderIdStr = String(order.order_id);
      const updated = await P2PService.updateOrderStatus(orderIdStr, status, transferCode);
      if (updated) {
        setOrder(updated);
      }
    } catch (err) {
      setOrder(prevOrder);
      throw err;
    }
  };

  useEffect(() => {
    if (!orderId || !wsManager) return;
    const orderIdStr = String(orderId);
    const refreshOrder = async () => {
      try {
        const updatedOrder = await P2PService.getOrderById(orderIdStr);
        setOrder(updatedOrder);
      } catch (error) {
        console.error('Error refreshing order:', error);
      }
    };

    const handleStatusUpdate = (event: WebSocketEvent) => {
      const payload = event.payload as Record<string, unknown> | undefined;
      const payloadOrderId = (payload?.['order_id'] || payload?.['orderId']) as string | number | undefined;
      const payloadOrderIdStr = payloadOrderId ? String(payloadOrderId) : undefined;

      if (!payloadOrderIdStr || payloadOrderIdStr !== orderIdStr) {
        return;
      }
      if (event.type === P2P_EVENT_TYPES.ORDER_STATUS_UPDATED) {
        const statusRaw = payload?.['status'];
        const status = typeof statusRaw === 'string' ? statusRaw : undefined;
        if (!status) return;

        setOrder((current) => (current ? { ...current, status: status as OrderStatus } : current));
        return;
      }

      if (event.type === P2P_EVENT_TYPES.ORDER_CONFIRMED || event.type === P2P_EVENT_TYPES.ORDER_COMPLETED) {
        refreshOrder();
        return;
      }
    };

    wsManager.on(P2P_EVENT_TYPES.ORDER_STATUS_UPDATED, handleStatusUpdate);
    wsManager.on(P2P_EVENT_TYPES.ORDER_CONFIRMED, handleStatusUpdate);
    wsManager.on(P2P_EVENT_TYPES.ORDER_COMPLETED, handleStatusUpdate);

    return () => {
      wsManager.off(P2P_EVENT_TYPES.ORDER_STATUS_UPDATED, handleStatusUpdate);
      wsManager.off(P2P_EVENT_TYPES.ORDER_CONFIRMED, handleStatusUpdate);
      wsManager.off(P2P_EVENT_TYPES.ORDER_COMPLETED, handleStatusUpdate);
    };
  }, [orderId, wsManager]);

  return { order, isLoading, error, updateOrderStatus };
};
