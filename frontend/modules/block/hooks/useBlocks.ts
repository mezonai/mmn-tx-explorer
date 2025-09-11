import { useQuery } from '@tanstack/react-query';
import { BlockService } from '../api';
import { BLOCKS_QUERY_KEY } from '../constants';
import { IBLockListParams } from '../types';
import { DEFAULT_STALE_TIME, LIMIT_TO_SKIP_STALE_TIME, STALE_TIME_LARGE_LIMIT } from '@/constant';

export const useBlocks = (params: IBLockListParams) => {
  return useQuery({
    queryKey: [BLOCKS_QUERY_KEY, params],
    queryFn: () =>
      BlockService.getBlocks({
        ...params,
        page: params.page - 1,
      }),
    enabled: !!params,
    staleTime: params.limit >= LIMIT_TO_SKIP_STALE_TIME ? STALE_TIME_LARGE_LIMIT : DEFAULT_STALE_TIME,
  });
};
