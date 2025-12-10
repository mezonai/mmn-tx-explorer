import { useQuery } from '@tanstack/react-query';
import { IPaginatedResponse } from '@/types';
import { IP2POfferListParams, P2POffer } from '../types';
import { P2PService } from '../api';
import { P2P_QUERY_KEYS } from '../constants';

export const useP2POffers = (params: IP2POfferListParams) => {
  return useQuery<IPaginatedResponse<P2POffer[]>>({
    queryKey: [P2P_QUERY_KEYS.OFFERS, params],
    queryFn: () => P2PService.getOffers(params),
  });
};
