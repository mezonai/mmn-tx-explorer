import { useQuery } from '@tanstack/react-query';
import { P2PService } from '../api';
import { P2P_QUERY_KEYS } from '../constants';
import { IP2POfferListParams } from '../types';

export const useP2PMyOffers = (params: IP2POfferListParams, enabled: boolean = true) => {
  return useQuery({
    queryKey: [P2P_QUERY_KEYS.MY_OFFERS, params],
    queryFn: () => P2PService.getMyOffers(params),
    enabled: enabled && !!params,
  });
};
