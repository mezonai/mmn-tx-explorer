import { useQuery } from '@tanstack/react-query';
import { TransactionService } from '../api';
import { PENDING_TRANSACTIONS_QUERY_KEY } from '../constants';
import { ITransactionListParams } from '../types';
import { ETransactionTab } from '../enums';

export const usePendingTransactions = (params: ITransactionListParams, tab: ETransactionTab) => {
  return useQuery({
    queryKey: [PENDING_TRANSACTIONS_QUERY_KEY, params],
    queryFn: () =>
      TransactionService.getPendingTransactions({
        page: params.page - 1,
        limit: params.limit,
      }),
    enabled: !!params && tab === ETransactionTab.Pending,
  });
};
