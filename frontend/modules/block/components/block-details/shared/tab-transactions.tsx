import { Pagination } from '@/components/ui/pagination';
import { PAGINATION } from '@/constant';
import { usePaginationQueryParam } from '@/hooks';
import { ITransaction, ITransactionListParams, TransactionService } from '@/modules/transaction';
import { TransactionCollection } from '@/modules/transaction/components/transaction-list/list/transaction-collection';
import { IPaginationMeta } from '@/types';
import { useEffect, useState } from 'react';

interface TabTransactionsProps {
  blockNumber: number;
}

const DEFAULT_TRANSACTION_SEARCH_PARAMS: ITransactionListParams = {
  page: PAGINATION.DEFAULT_PAGE,
  limit: PAGINATION.DEFAULT_LIMIT,
  sort_by: 'transaction_timestamp',
  sort_order: 'desc',
};

export const TabTransactions = ({ blockNumber }: TabTransactionsProps) => {
  const [pagination, setPagination] = useState<IPaginationMeta>();
  const [transactions, setTransactions] = useState<ITransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { page, limit, handleChangePage, handleChangeLimit } = usePaginationQueryParam();

  const fetchTransactions = async (params: ITransactionListParams) => {
    try {
      setIsLoading(true);
      const txsPage = await TransactionService.getTransactions(params);
      setTransactions(txsPage.data);
      setPagination(txsPage.meta);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!blockNumber) return;
    fetchTransactions({
      ...DEFAULT_TRANSACTION_SEARCH_PARAMS,
      filter_block_number: blockNumber,
      page: page - 1,
      limit: limit,
    });
  }, [blockNumber, page, limit]);

  return (
    <div>
      <div className="relative mb-5 lg:-top-15 lg:-mb-10">
        <Pagination
          page={page}
          limit={limit}
          totalPages={pagination?.total_pages ?? 0}
          totalItems={pagination?.total_items ?? 0}
          isLoading={isLoading}
          className="self-end"
          onChangePage={handleChangePage}
          onChangeLimit={handleChangeLimit}
        />
      </div>
      <TransactionCollection transactions={transactions} skeletonLimit={5} />
      <div className="h-1000" />
    </div>
  );
};
