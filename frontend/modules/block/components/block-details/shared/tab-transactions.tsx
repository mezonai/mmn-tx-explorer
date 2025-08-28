import { Pagination } from '@/components/ui/pagination';
import { usePaginationQueryParam } from '@/hooks';
import { ITransaction, TransactionService } from '@/modules/transaction';
import { TransactionCollection } from '@/modules/transaction/components/transaction-list/list/transaction-collection';
import { IPaginationMeta } from '@/types';
import { useEffect, useState } from 'react';

interface TabTransactionsProps {
  blockNumber: number;
}

export const TabTransactions = ({ blockNumber }: TabTransactionsProps) => {
  const [pagination, setPagination] = useState<IPaginationMeta>();
  const [transactions, setTransactions] = useState<ITransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { page, limit, handleChangePage, handleChangeLimit } = usePaginationQueryParam();

  useEffect(() => {
    if (!blockNumber) return;

    const fetchTransactions = async () => {
      try {
        setIsLoading(true);
        const txsPage = await TransactionService.getTxsByBlockNumber(blockNumber);
        setTransactions(txsPage.data);
        setPagination(txsPage.meta);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, [blockNumber]);

  return (
    <div>
      <div className="relative mb-5 md:-top-15 md:-mb-10">
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
