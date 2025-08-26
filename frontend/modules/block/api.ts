import apiClient from '@/service';
import { buildPathWithChainId } from '@/service/utils';
import { IPaginatedResponse } from '@/types';
import { BLOCK_ENDPOINTS } from './constants';
import { IBlock, IBlockDetails, IBlockDetailsResponse, IBLockListParams } from './types';

export class BlockService {
  static async getBlocks(params: IBLockListParams): Promise<IPaginatedResponse<IBlock[]>> {
    const { data } = await apiClient.get<IPaginatedResponse<IBlock[]>>(buildPathWithChainId(BLOCK_ENDPOINTS.LIST), {
      params,
    });
    return data;
  }

  static async getBlockDetails(blockNumber: string): Promise<IBlockDetails> {
    const { data } = await apiClient.get<IBlockDetailsResponse>(
      buildPathWithChainId(BLOCK_ENDPOINTS.DETAILS(blockNumber))
    );
    return data.data;
  }
}
