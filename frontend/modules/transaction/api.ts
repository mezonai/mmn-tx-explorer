import apiClient from '@/service';
import { buildPathWithChain } from '@/service/utils';
import { IPaginatedResponse } from '@/types';
import { TRANSACTION_ENDPOINTS } from './constants';
import { ITransaction, ITransactionListParams } from './types';

export class TransactionService {
  static async getTransactions(params: ITransactionListParams): Promise<IPaginatedResponse<ITransaction[]>> {
    const { data } = await apiClient.get<IPaginatedResponse<ITransaction[]>>(
      buildPathWithChain(TRANSACTION_ENDPOINTS.LIST, '1337'),
      { params }
    );
    return data;
  }
}
