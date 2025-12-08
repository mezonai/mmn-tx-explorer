import { useQuery } from '@tanstack/react-query';
import { GamesService } from '../api';
import { IMezonGameTagResponse } from '../types';

export const useGameTags = () => {
  return useQuery<IMezonGameTagResponse>({
    queryKey: ['mezon-games-tag'],
    queryFn: () => GamesService.getTags(),
  });
};
