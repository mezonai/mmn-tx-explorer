import apiClient from '@/lib/axios';
import { IPaginatedResponse } from '@/types';
import { BLOCK_ENDPOINTS } from './constants';
import { IBlock, IBLockListParams } from './types';

export class BlockService {
  static async getBlocks(params: IBLockListParams): Promise<IPaginatedResponse<IBlock>> {
    const { data } = await apiClient.get<IPaginatedResponse<IBlock>>(BLOCK_ENDPOINTS.LIST.replace(':chainId', '1337'), {
      params,
    });
    return data;
  }
}
