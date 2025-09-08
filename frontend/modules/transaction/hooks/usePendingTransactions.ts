import { useQuery } from '@tanstack/react-query';
import { TransactionService } from '../api';
import { PENDING_TRANSACTIONS_QUERY_KEY } from '../constants';
import { ITransactionListParams } from '../types';

export const usePendingTransactions = (params: ITransactionListParams) => {
  return useQuery({
    queryKey: [PENDING_TRANSACTIONS_QUERY_KEY, params],
    queryFn: () =>
      TransactionService.getPendingTransactions({
        page: params.page - 1,
        limit: params.limit,
      }),
    enabled: !!params,
  });
};
