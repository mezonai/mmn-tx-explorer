import { useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { P2PService } from '../api';
import { P2P_QUERY_KEYS, P2P_EVENT_TYPES, WS_INVALIDATE_DELAY } from '../constants';
import { IP2POfferListParams } from '../types';
import { useWebSocket } from '@/lib/websocket';

const WS_REFRESH_ANIM_MS = 1200;

export const useP2POffers = (
  params: IP2POfferListParams,
  enabled: boolean = true
): UseQueryResult<any, unknown> & { isWsRefreshing: boolean } => {
  const wsManager = useWebSocket();
  const queryClient = useQueryClient();

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refreshAnimTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isWsRefreshing, setIsWsRefreshing] = useState(false);

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

      // start UI refresh animation
      setIsWsRefreshing(true);
      if (refreshAnimTimerRef.current) clearTimeout(refreshAnimTimerRef.current);
      refreshAnimTimerRef.current = setTimeout(() => setIsWsRefreshing(false), WS_REFRESH_ANIM_MS);

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
      if (refreshAnimTimerRef.current) {
        clearTimeout(refreshAnimTimerRef.current);
      }
    };
  }, [wsManager, enabled, queryClient]);

  return { ...query, isWsRefreshing };
};
