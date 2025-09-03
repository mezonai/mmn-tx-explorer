import apiClient from '@/service';
import { buildPathWithChain } from '@/service/utils';
import { IPaginatedResponse } from '@/types';
import { BLOCK_ENDPOINTS } from './constants';
import { IBlock, IBlockDetails, IBlockDetailsResponse, IBLockListParams } from './types';

export class BlockService {
  static async getBlocks(params: IBLockListParams): Promise<IPaginatedResponse<IBlock[]>> {
    const { data } = await apiClient.get<IPaginatedResponse<IBlock[]>>(buildPathWithChain(BLOCK_ENDPOINTS.LIST), {
      params,
    });
    return data;
  }

  static async getBlockDetails(blockNumber: number): Promise<IBlockDetails> {
    const { data } = await apiClient.get<IBlockDetailsResponse>(
      buildPathWithChain(BLOCK_ENDPOINTS.DETAILS(blockNumber))
    );
    return data.data;
  }
}
