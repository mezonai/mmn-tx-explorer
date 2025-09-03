import { useEffect, useState } from 'react';

import { Pagination } from '@/components/ui/pagination';
import { PAGINATION } from '@/constant';
import { EBreakpoint, ESortOrder } from '@/enums';
import { useBreakpoint, usePaginationQueryParam } from '@/hooks';
import { ITransaction, ITransactionListParams, TransactionService } from '@/modules/transaction';
import { MobileWalletTransactionsTable, WalletTransactionsTable } from '@/modules/transaction/components';
import { IPaginationMeta } from '@/types';
import { PageLoading } from '@/components/shared/page-loading';

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
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [localSearchParams, setLocalSearchParams] = useState<ITransactionListParams>();
  const { page, limit, handleChangePage, handleChangeLimit } = usePaginationQueryParam();
  const isDesktop = useBreakpoint(EBreakpoint.LG);
  const isEmptyTransactions = transactions && transactions.length === 0;
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

  if (isDesktop === undefined) {
    return <PageLoading />;
  }
  return (
    <div>
      {!isEmptyTransactions && (
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
      )}

      {isDesktop ? (
        <WalletTransactionsTable walletAddress={walletAddress} transactions={transactions} skeletonLength={limit} />
      ) : (
        <MobileWalletTransactionsTable
          isLoading={isLoading}
          walletAddress={walletAddress}
          transactions={transactions ?? []}
          skeletonLength={limit}
          isEmptyTransactions={isEmptyTransactions}
        />
      )}
    </div>
  );
};
