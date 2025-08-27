import apiClient from '@/service';
import { buildPathWithChain } from '@/service/utils';
import { IPaginatedResponse } from '@/types';
import { TRANSACTION_ENDPOINTS } from './constants';
import { ITransaction, ITransactionDetailsResponse, ITransactionListParams } from './types';

export class TransactionService {
  static async getTransactions(params: ITransactionListParams): Promise<IPaginatedResponse<ITransaction[]>> {
    const { data } = await apiClient.get<IPaginatedResponse<ITransaction[]>>(
      buildPathWithChain(TRANSACTION_ENDPOINTS.LIST),
      { params }
    );
    return data;
  }

  static async getTransactionDetails(transactionHash: string): Promise<ITransaction> {
    const { data } = await apiClient.get<ITransactionDetailsResponse>(
      buildPathWithChain(TRANSACTION_ENDPOINTS.DETAIL(transactionHash))
    );
    return data.data.transaction;
  }

  static async getTxsByBlockNumber(blockNumber: number): Promise<IPaginatedResponse<ITransaction[]>> {
    const { data } = await apiClient.get<IPaginatedResponse<ITransaction[]>>(
      buildPathWithChain(TRANSACTION_ENDPOINTS.LIST),
      { params: { filter_block_number: blockNumber } }
    );
    return data;
  }
}
