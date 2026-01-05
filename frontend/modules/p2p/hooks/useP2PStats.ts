import { useQuery } from '@tanstack/react-query';
import { P2PService } from '../api';
import { P2P_QUERY_KEYS } from '../constants';

export const useP2PStats = () => {
    return useQuery({
        queryKey: [P2P_QUERY_KEYS.OFFERS, 'stats'],
        queryFn: async () => {
            const response = await P2PService.getOffers({
                page: 1,
                limit: 1,
            });

            return {
                totalOffers: response.meta?.total_items || 0,
                totalAvailableAmount: response.meta?.total_available || 0,
            };
        },
        staleTime: 30000,
        refetchInterval: 60000,
    });
};
