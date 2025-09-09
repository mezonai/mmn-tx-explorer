import { useQuery } from '@tanstack/react-query';
import { DashboardService } from '../api';
import { DASHBOARD_STATS_QUERY_KEY } from '../constants';

export const useStats = () => {
  const { data: statsResponse } = useQuery({
    queryKey: [DASHBOARD_STATS_QUERY_KEY],
    queryFn: DashboardService.getStats,
  });
  return statsResponse?.data;
};
