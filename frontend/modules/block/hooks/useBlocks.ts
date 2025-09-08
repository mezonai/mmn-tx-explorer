import { useQuery } from '@tanstack/react-query';
import { BlockService } from '../api';
import { BLOCKS_QUERY_KEY } from '../constants';
import { IBLockListParams } from '../types';

export const useBlocks = (params: IBLockListParams) => {
  return useQuery({
    queryKey: [BLOCKS_QUERY_KEY, params],
    queryFn: () =>
      BlockService.getBlocks({
        ...params,
        page: params.page - 1,
      }),
    enabled: !!params,
  });
};
