import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { P2PService } from '../api';
import { P2P_QUERY_KEYS, P2P_EVENT_TYPES } from '../constants';
import { IP2POfferListParams } from '../types';
import { useWebSocket } from '@/lib/websocket';

export const useP2POffers = (params: IP2POfferListParams, enabled: boolean = true) => {
  const wsManager = useWebSocket();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [P2P_QUERY_KEYS.OFFERS, params],
    queryFn: () => P2PService.getOffers(params),
    enabled: enabled && !!params,
  });

  useEffect(() => {
    if (!wsManager || !enabled) return;

    const handleOfferListRefresh = () => {
      queryClient.invalidateQueries({ queryKey: [P2P_QUERY_KEYS.OFFERS] });
    };

    wsManager.on(P2P_EVENT_TYPES.OFFER_LIST_REFRESH, handleOfferListRefresh);

    return () => {
      wsManager.off(P2P_EVENT_TYPES.OFFER_LIST_REFRESH, handleOfferListRefresh);
    };
  }, [wsManager, enabled, queryClient]);

  return query;
};
