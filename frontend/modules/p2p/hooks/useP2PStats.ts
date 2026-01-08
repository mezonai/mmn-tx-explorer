import { useQuery } from '@tanstack/react-query';
import { P2PService } from '../api';
import { P2P_QUERY_KEYS, P2P_STATS_STALE_TIME, P2P_STATS_REFETCH_INTERVAL } from '../constants';
import { useStats } from '@/modules/dashboard/hooks/useStas';

export interface P2PStats {
    totalOffers: number;
    totalAvailableAmount: number;
}

export const useP2PStats = () => {
    const dashboardStats = useStats();

    const { data } = useQuery({
        queryKey: [P2P_QUERY_KEYS.OFFERS, 'stats'],
        queryFn: async () => {
            const response = await P2PService.getOffers({
                page: 1,
                limit: 1,
            });

            const stats: P2PStats = {
                totalOffers: response.meta?.total_items || 0,
                totalAvailableAmount: dashboardStats?.total_p2p_offer_available || 0,
            };

            return stats;
        },
        staleTime: P2P_STATS_STALE_TIME,
        refetchInterval: P2P_STATS_REFETCH_INTERVAL,
        enabled: !!dashboardStats,
    });

    const fallback: P2PStats = {
        totalOffers: 0,
        totalAvailableAmount: 0,
    };

    return {
        stats: data || fallback,
    };
};
