import { useQuery } from '@tanstack/react-query';
import { ITransactionListParams } from '../types';
import { TRANSACTIONS_QUERY_KEY } from '../constants';
import { TransactionService } from '../api';
import { ETransactionTab } from '../enums';

export const useTransactions = (params: ITransactionListParams, tab: ETransactionTab = ETransactionTab.Validated) => {
  return useQuery({
    queryKey: [TRANSACTIONS_QUERY_KEY, params],
    queryFn: () =>
      TransactionService.getTransactions({
        ...params,
        page: params.page - 1,
      }),
    enabled: !!params && tab === ETransactionTab.Validated,
  });
};
