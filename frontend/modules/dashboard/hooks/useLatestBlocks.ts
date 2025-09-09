import { BlockService } from '@/modules/block';
import { useQuery } from '@tanstack/react-query';
import { DASHBOARD_BLOCK_FILTER, DASHBOARD_BLOCKS_QUERY_KEY } from '../constants';
export const useLatestBlocks = () => {
  const { data: blocksResponse } = useQuery({
    queryKey: [DASHBOARD_BLOCKS_QUERY_KEY],
    queryFn: () => BlockService.getBlocks(DASHBOARD_BLOCK_FILTER),
  });
  return blocksResponse?.data;
};
