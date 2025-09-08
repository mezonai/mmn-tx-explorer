import { useEffect, useState } from 'react';

import { Pagination } from '@/components/ui/pagination';
import { PAGINATION } from '@/constant';
import { EBreakpoint, ESortOrder } from '@/enums';
import { useBreakpoint, usePaginationQueryParam } from '@/hooks';
import { ITransactionListParams } from '@/modules/transaction';
import { MobileWalletTransactionsTable, WalletTransactionsTable } from '@/modules/transaction/components';
import { useTransactions } from '@/modules/transaction/hooks/useTransactions';

interface SentTransactionsTabProps {
  walletAddress: string;
}

const DEFAULT_VALUE_DATA_SEARCH: ITransactionListParams = {
  page: PAGINATION.DEFAULT_PAGE,
  limit: PAGINATION.DEFAULT_LIMIT,
  sort_by: 'transaction_timestamp',
  sort_order: ESortOrder.DESC,
} as const;

export const SentTransactionsTab = ({ walletAddress }: SentTransactionsTabProps) => {
  const [localSearchParams, setLocalSearchParams] = useState<ITransactionListParams>();
  const { data: transactionsResponse, isLoading: isLoadingTransactions } = useTransactions({
    ...(localSearchParams ?? DEFAULT_VALUE_DATA_SEARCH),
    filter_from_address: walletAddress,
  });
  const transactions = transactionsResponse?.data;
  const pagination = transactionsResponse?.meta;

  const { page, limit, handleChangePage, handleChangeLimit } = usePaginationQueryParam();
  const isDesktop = useBreakpoint(EBreakpoint.LG);
  const isEmptyTransactions = transactions && transactions.length === 0;

  useEffect(() => {
    setLocalSearchParams({
      ...DEFAULT_VALUE_DATA_SEARCH,
      page,
      limit,
    });
  }, [page, limit]);

  return (
    <div>
      {!isEmptyTransactions && (
        <Pagination
          page={page}
          limit={limit}
          totalPages={pagination?.total_pages ?? 0}
          totalItems={pagination?.total_items ?? 0}
          isLoading={isLoadingTransactions}
          className="w-full pb-6 lg:w-auto"
          onChangePage={handleChangePage}
          onChangeLimit={handleChangeLimit}
        />
      )}

      {isDesktop ? (
        <WalletTransactionsTable walletAddress={walletAddress} transactions={transactions} skeletonLength={limit} />
      ) : (
        <MobileWalletTransactionsTable
          isLoading={isLoadingTransactions}
          walletAddress={walletAddress}
          transactions={transactions ?? []}
          skeletonLength={limit}
          isEmptyTransactions={isEmptyTransactions}
        />
      )}
    </div>
  );
};
