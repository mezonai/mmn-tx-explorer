import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { useWebSocket } from '@/lib/websocket';
import { P2PService } from '../api';
import { P2P_QUERY_KEYS, P2P_EVENT_TYPES, WS_INVALIDATE_DELAY } from '../constants';
import { IP2POfferListParams } from '../types';

export const useP2PMyOffers = (params: IP2POfferListParams, enabled: boolean = true) => {
  const wsManager = useWebSocket();
  const queryClient = useQueryClient();
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const query = useQuery({
    queryKey: [P2P_QUERY_KEYS.MY_OFFERS, params],
    queryFn: () => P2PService.getMyOffers(params),
    enabled: enabled && !!params,
  });

  useEffect(() => {
    if (!wsManager || !enabled) return;

    const handleRefresh = () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: [P2P_QUERY_KEYS.MY_OFFERS],
        });
      }, WS_INVALIDATE_DELAY);
    };

    wsManager.on(P2P_EVENT_TYPES.ORDER_CREATED, handleRefresh);
    wsManager.on(P2P_EVENT_TYPES.ORDER_CONFIRMED, handleRefresh);
    wsManager.on(P2P_EVENT_TYPES.ORDER_COMPLETED, handleRefresh);

    return () => {
      wsManager.off(P2P_EVENT_TYPES.ORDER_CREATED, handleRefresh);
      wsManager.off(P2P_EVENT_TYPES.ORDER_CONFIRMED, handleRefresh);
      wsManager.off(P2P_EVENT_TYPES.ORDER_COMPLETED, handleRefresh);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [wsManager, enabled, queryClient]);

  return query;
};
