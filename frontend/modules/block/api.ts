import apiClient from '@/service';
import { buildPathWithChain } from '@/service/utils';
import { IPaginatedResponse } from '@/types';
import { BLOCK_ENDPOINTS } from './constants';
import { IBlock, IBLockListParams } from './types';

export class BlockService {
  static async getBlocks(params: IBLockListParams): Promise<IPaginatedResponse<IBlock[]>> {
    const { data } = await apiClient.get<IPaginatedResponse<IBlock[]>>(
      buildPathWithChain(BLOCK_ENDPOINTS.LIST, '1337'),
      {
        params,
      }
    );
    return data;
  }
}
