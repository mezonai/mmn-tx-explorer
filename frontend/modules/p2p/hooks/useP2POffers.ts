import { useQuery } from '@tanstack/react-query';
import { P2PService } from '../api';
import { P2P_QUERY_KEYS } from '../constants';
import { IP2POfferListParams } from '../types';

export const useP2POffers = (params: IP2POfferListParams) => {
  return useQuery({
    queryKey: [P2P_QUERY_KEYS.OFFERS, params],
    queryFn: () => P2PService.getOffers(params),
    enabled: !!params,
  });
};
