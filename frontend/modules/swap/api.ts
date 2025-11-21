import { apiDongClient } from '@/service';
import { SWAP_ENDPOINTS } from './constants';
import { CreateSwapHistoryRequest, CreateSwapHistoryResponse } from './types';

export class SwapService {
  /**
   * Create swap history record after successful transaction
   */
  static async createSwapHistory(data: CreateSwapHistoryRequest): Promise<CreateSwapHistoryResponse> {
    const { data: response } = await apiDongClient.post<CreateSwapHistoryResponse>(
      SWAP_ENDPOINTS.CREATE_SWAP_HISTORY,
      data
    );
    return response;
  }
}
