import { useEffect, useState } from 'react';

import { Pagination } from '@/components/ui/pagination';
import { PAGINATION } from '@/constant';
import { ESortOrder } from '@/enums';
import { usePaginationQueryParam } from '@/hooks';
import { ITransaction, ITransactionListParams, TransactionService } from '@/modules/transaction';
import { WalletTransactionsTable } from '@/modules/transaction/components';
import { IPaginationMeta } from '@/types';

interface AllTransactionsTabProps {
  walletAddress: string;
}

const DEFAULT_VALUE_DATA_SEARCH: ITransactionListParams = {
  page: PAGINATION.DEFAULT_PAGE,
  limit: PAGINATION.DEFAULT_LIMIT,
  sort_by: 'transaction_timestamp',
  sort_order: ESortOrder.DESC,
} as const;

export const AllTransactionsTab = ({ walletAddress }: AllTransactionsTabProps) => {
  const [transactions, setTransactions] = useState<ITransaction[]>();
  const [pagination, setPagination] = useState<IPaginationMeta>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [localSearchParams, setLocalSearchParams] = useState<ITransactionListParams>();
  const { page, limit, handleChangePage, handleChangeLimit } = usePaginationQueryParam();

  const handleFetchTransactions = async (params: ITransactionListParams, walletAddress: string) => {
    try {
      setIsLoading(true);
      setTransactions(undefined);

      const { meta, data } = await TransactionService.getTransactions({
        ...params,
        page: params.page - 1,
        wallet_address: walletAddress,
      });
      setTransactions(data);
      setPagination(meta);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setLocalSearchParams({
      ...DEFAULT_VALUE_DATA_SEARCH,
      page,
      limit,
    });
  }, [page, limit]);

  useEffect(() => {
    if (!localSearchParams) return;
    handleFetchTransactions(localSearchParams, walletAddress);
  }, [localSearchParams, walletAddress]);

  return (
    <div>
      <Pagination
        page={page}
        limit={limit}
        totalPages={pagination?.total_pages ?? 0}
        totalItems={pagination?.total_items ?? 0}
        isLoading={isLoading}
        className="w-full pb-6 lg:w-auto"
        onChangePage={handleChangePage}
        onChangeLimit={handleChangeLimit}
      />

      <WalletTransactionsTable walletAddress={walletAddress} transactions={transactions} skeletonLength={limit} />
    </div>
  );
};
