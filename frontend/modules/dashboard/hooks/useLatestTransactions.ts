import { TransactionService } from '@/modules/transaction';
import { useQuery } from '@tanstack/react-query';
import { DASHBOARD_TRANSACTION_FILTER, DASHBOARD_TRANSACTIONS_QUERY_KEY } from '../constants';

export const useLatestTransactions = () => {
  const { data: transactionsResponse } = useQuery({
    queryKey: [DASHBOARD_TRANSACTIONS_QUERY_KEY],
    queryFn: () => TransactionService.getTransactions(DASHBOARD_TRANSACTION_FILTER),
  });
  return transactionsResponse?.data;
};
