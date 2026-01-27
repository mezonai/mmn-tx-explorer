import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { P2PService } from '../api';
import { P2P_QUERY_KEYS, P2P_EVENT_TYPES } from '../constants';
import { IP2POfferListParams } from '../types';
import { useWebSocket } from '@/lib/websocket';

const WS_INVALIDATE_DELAY = 1000;

export const useP2POffers = (params: IP2POfferListParams, enabled: boolean = true) => {
  const wsManager = useWebSocket();
  const queryClient = useQueryClient();

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const query = useQuery({
    queryKey: [P2P_QUERY_KEYS.OFFERS, params],
    queryFn: () => P2PService.getOffers(params),
    enabled: enabled && !!params,
  });

  useEffect(() => {
    if (!wsManager || !enabled) return;

    const handleOfferListRefresh = () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: [P2P_QUERY_KEYS.OFFERS],
        });
      }, WS_INVALIDATE_DELAY);
    };

    wsManager.on(P2P_EVENT_TYPES.OFFER_LIST_REFRESH, handleOfferListRefresh);

    return () => {
      wsManager.off(P2P_EVENT_TYPES.OFFER_LIST_REFRESH, handleOfferListRefresh);

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [wsManager, enabled, queryClient]);

  return query;
};
