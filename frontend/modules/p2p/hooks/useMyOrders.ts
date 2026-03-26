import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { useWebSocket } from '@/lib/websocket';
import { P2PService } from '../api';
import { P2P_QUERY_KEYS, P2P_EVENT_TYPES, WS_INVALIDATE_DELAY } from '../constants';
import { IP2POfferListParams } from '../types';

export const useMyOrders = (params: IP2POfferListParams, enabled: boolean = true) => {
  const wsManager = useWebSocket();
  const queryClient = useQueryClient();
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const query = useQuery({
    queryKey: [P2P_QUERY_KEYS.MY_ORDERS, params],
    queryFn: () => P2PService.getMyOrders(params),
    enabled: enabled && !!params,
  });

  useEffect(() => {
    if (!wsManager || !enabled) return;

    const handleOrderRefresh = () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: [P2P_QUERY_KEYS.MY_ORDERS],
        });
        // Also invalidate specific order details if user is viewing one
        queryClient.invalidateQueries({
          queryKey: [P2P_QUERY_KEYS.ORDER],
        });
      }, WS_INVALIDATE_DELAY);
    };

    wsManager.on(P2P_EVENT_TYPES.ORDER_CREATED, handleOrderRefresh);
    wsManager.on(P2P_EVENT_TYPES.ORDER_CONFIRMED, handleOrderRefresh);
    wsManager.on(P2P_EVENT_TYPES.ORDER_COMPLETED, handleOrderRefresh);

    return () => {
      wsManager.off(P2P_EVENT_TYPES.ORDER_CREATED, handleOrderRefresh);
      wsManager.off(P2P_EVENT_TYPES.ORDER_CONFIRMED, handleOrderRefresh);
      wsManager.off(P2P_EVENT_TYPES.ORDER_COMPLETED, handleOrderRefresh);

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [wsManager, enabled, queryClient]);

  return query;
};
