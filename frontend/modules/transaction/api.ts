import apiClient from '@/lib/axios';
import { IPaginatedResponse } from '@/types';
import { TRANSACTION_ENDPOINTS } from './constants';
import { ITransaction, ITransactionListParams } from './types';

export class TransactionService {
  static async getTransactions(params: ITransactionListParams): Promise<IPaginatedResponse<ITransaction>> {
    const { data } = await apiClient.get<IPaginatedResponse<ITransaction>>(
      TRANSACTION_ENDPOINTS.LIST.replace(':chainId', '1337'),
      { params }
    );
    return data;
  }
}
