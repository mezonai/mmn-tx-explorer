import { useQuery } from '@tanstack/react-query';
import { P2PService } from '../api';
import { P2P_QUERY_KEYS, P2P_STATS_STALE_TIME, P2P_STATS_REFETCH_INTERVAL } from '../constants';

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
        staleTime: P2P_STATS_STALE_TIME,
        refetchInterval: P2P_STATS_REFETCH_INTERVAL,
    });
};

