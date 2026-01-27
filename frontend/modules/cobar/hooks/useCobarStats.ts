import { CobarService } from '../api';
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '../constants';
import type { CobarStats } from '../types';

export const useCobarStats = () => {
  const { data, isLoading } = useQuery<CobarStats>({
    queryKey: [QUERY_KEYS.COBAR_STATS],
    queryFn: () => CobarService.getStats(),
  });
  return {
    cobarStats: data,
    isLoading,
  };
};
