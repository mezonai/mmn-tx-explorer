import { useQuery } from '@tanstack/react-query';
import { GamesService } from '../api';
import { IMezonGameListParams, IMezonGamePaginatedResponse } from '../types';

export const useGames = (params: IMezonGameListParams) => {
  return useQuery<IMezonGamePaginatedResponse>({
    queryKey: ['mezon-games', params],
    queryFn: () => GamesService.getGames(params),
    enabled: !!params,
  });
};
