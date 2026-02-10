import { useStats } from '@/modules/dashboard/hooks/useStas';

export interface P2PStats {
    totalOffers: number;
    totalAvailableAmount: number;
}

export const useP2PStats = () => {
    const dashboardStats = useStats();

    const fallback: P2PStats = {
        totalOffers: 0,
        totalAvailableAmount: 0,
    };

    if (!dashboardStats) {
        return { stats: fallback };
    }

    const stats: P2PStats = {
        totalOffers: dashboardStats.total_offers || 0,
        totalAvailableAmount: dashboardStats.total_p2p_offer_available || 0,
    };

    return {
        stats,
    };
};