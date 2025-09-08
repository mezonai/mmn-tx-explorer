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

  static async getPendingTransactions(
    params: Pick<ITransactionListParams, 'page' | 'limit'>
  ): Promise<IPaginatedResponse<ITransaction[]>> {
    const { data } = await apiClient.get<IPaginatedResponse<ITransaction[]>>(
      buildPathWithChain(TRANSACTION_ENDPOINTS.PENDING),
      { params }
    );
    return data;
  }

  static async getTransactionDetails(transactionHash: string): Promise<ITransaction> {
    const { data } = await apiClient.get<ITransactionDetailsResponse>(
      buildPathWithChain(TRANSACTION_ENDPOINTS.DETAIL(transactionHash))
    );
    console.log('data', data);
    return data.data.transaction;
  }

  static async getPendingTransactionDetails(transactionHash: string): Promise<ITransaction> {
    const { data } = await apiClient.get<ITransactionDetailsResponse>(
      buildPathWithChain(TRANSACTION_ENDPOINTS.PENDING_DETAIL(transactionHash))
    );
    return data.data.transaction;
  }
}
