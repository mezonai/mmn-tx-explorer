import apiClient from '@/service';
import { buildPathWithChainId } from '@/service/utils';
import { IPaginatedResponse } from '@/types';
import { TRANSACTION_ENDPOINTS } from './constants';
import { ITransaction, ITransactionListParams } from './types';

export class TransactionService {
  static async getTransactions(params: ITransactionListParams): Promise<IPaginatedResponse<ITransaction[]>> {
    const { data } = await apiClient.get<IPaginatedResponse<ITransaction[]>>(
      buildPathWithChainId(TRANSACTION_ENDPOINTS.LIST),
      { params }
    );
    return data;
  }
}
