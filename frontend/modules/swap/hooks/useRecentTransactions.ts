import { useQuery } from '@tanstack/react-query';
import { SwapService } from '../api';
import { QUERY_KEYS } from '../constants';
import { staleTime } from '@/constant/token.constant';

export const useRecentTransactions = (page: number = 0, limit: number = 2) => {
  return useQuery({
    queryKey: [QUERY_KEYS.SWAP_HISTORY, page, limit],
    queryFn: () => SwapService.getRecentTransactions(page, limit),
    staleTime: staleTime,
    refetchInterval: staleTime,
  });
};
