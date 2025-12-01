import { apiGameClient } from '@/service';
import { GAME_ENDPOINTS } from './constants';
import { IMezonGameListParams, IMezonGamePaginatedResponse } from './types';

export class GamesService {
  static async getGames(params: IMezonGameListParams): Promise<IMezonGamePaginatedResponse> {
    const { data } = await apiGameClient.get<IMezonGamePaginatedResponse>(GAME_ENDPOINTS.SEARCH, { params });
    return data;
  }
}
