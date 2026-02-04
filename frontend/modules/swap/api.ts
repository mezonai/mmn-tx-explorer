import { apiDongClient } from '@/service';
import { SWAP_ENDPOINTS } from './constants';
import { CreateSwapHistoryRequest, CreateSwapHistoryResponse, RecentTransactionsResponse } from './types';

export class SwapService {
  static async createSwapHistory(data: CreateSwapHistoryRequest): Promise<CreateSwapHistoryResponse> {
    const { data: response } = await apiDongClient.post<CreateSwapHistoryResponse>(
      SWAP_ENDPOINTS.CREATE_SWAP_HISTORY,
      data
    );
    return response;
  }

  static async getRecentTransactions(page: number = 0, limit: number = 2): Promise<RecentTransactionsResponse> {
    const { data: response } = await apiDongClient.get<RecentTransactionsResponse>(
      SWAP_ENDPOINTS.RECENT_TRANSACTIONS,
      {
        params: { page, limit },
      }
    );
    return response;
  }
}
