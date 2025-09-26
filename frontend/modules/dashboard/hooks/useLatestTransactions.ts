import { TransactionService } from '@/modules/transaction';
import { useQuery } from '@tanstack/react-query';
import { DASHBOARD_TRANSACTION_FILTER, DASHBOARD_TRANSACTIONS_QUERY_KEY } from '../constants';

export const useLatestTransactions = () => {
  return useQuery({
    queryKey: [DASHBOARD_TRANSACTIONS_QUERY_KEY],
    queryFn: () => TransactionService.getTransactions(DASHBOARD_TRANSACTION_FILTER),
  });
};
