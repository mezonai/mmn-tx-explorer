'use client';
import { Pagination } from '@/components/ui/pagination';
import { PAGINATION } from '@/constant';
import { ESortOrder } from '@/enums';
import { usePaginationQueryParam } from '@/hooks';
import { ITransactionListParams } from '@/modules/transaction';
import { TransactionCollection } from '@/modules/transaction/components/transaction-list/list/transaction-collection';
import { useTransactions } from '@/modules/transaction/hooks/useTransactions';

interface TabTransactionsProps {
  blockNumber: number;
}

const DEFAULT_TRANSACTION_SEARCH_PARAMS: ITransactionListParams = {
  page: PAGINATION.DEFAULT_PAGE,
  limit: PAGINATION.DEFAULT_LIMIT,
  sort_by: 'transaction_timestamp',
  sort_order: ESortOrder.DESC,
};

export const TabTransactions = ({ blockNumber }: TabTransactionsProps) => {
  const { page, limit, handleChangePage, handleChangeLimit } = usePaginationQueryParam();
  const { data: transactionsResponse, isLoading: isLoadingTransactions } = useTransactions({
    ...DEFAULT_TRANSACTION_SEARCH_PARAMS,
    filter_block_number: blockNumber,
    page: page - 1,
    limit: limit,
  });
  const transactions = transactionsResponse?.data;
  const pagination = transactionsResponse?.meta;

  return (
    <div>
      <div>
        <Pagination
          page={page}
          limit={limit}
          totalPages={pagination?.total_pages ?? 0}
          totalItems={pagination?.total_items ?? 0}
          isLoading={isLoadingTransactions}
          className="mb-4 self-end"
          onChangePage={handleChangePage}
          onChangeLimit={handleChangeLimit}
          skeletonClassName="mb-4"
        />
      </div>
      <TransactionCollection transactions={transactions} isLoading={isLoadingTransactions} />
    </div>
  );
};
