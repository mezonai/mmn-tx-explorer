'use client';

import { Pagination } from '@/components/ui/pagination';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PAGINATION } from '@/constant';
import { ESortOrder } from '@/enums';
import { usePaginationQueryParam, useQueryParam } from '@/hooks';
import { ETransactionTab, ITransactionListParams } from '@/modules/transaction';
import { TransactionCollection } from './list';
import { Stats } from './stats';
import { useTransactions } from '../../hooks/useTransactions';
import { usePendingTransactions } from '../../hooks/usePendingTransactions';

const DEFAULT_VALUE_DATA_SEARCH: ITransactionListParams = {
  page: PAGINATION.DEFAULT_PAGE,
  limit: PAGINATION.DEFAULT_LIMIT,
  sort_by: 'transaction_timestamp',
  sort_order: ESortOrder.DESC,
} as const;

export const TransactionsList = () => {
  const { page, limit, handleChangePage, handleChangeLimit } = usePaginationQueryParam();
  const { value: tab, handleChangeValue: handleChangeTab } = useQueryParam<ETransactionTab>({
    queryParam: 'tab',
    defaultValue: ETransactionTab.Validated,
    clearParams: ['page'],
  });

  // Create search params directly from URL params to avoid double useEffect
  const searchParams: ITransactionListParams = {
    ...DEFAULT_VALUE_DATA_SEARCH,
    page,
    limit,
  };

  const { data: transactionsResponse, isLoading: isLoadingTransactions } = useTransactions(searchParams, tab);
  const { data: pendingTransactionsResponse, isLoading: isLoadingPendingTransactions } = usePendingTransactions(
    searchParams,
    tab
  );
  const isLoading = tab === ETransactionTab.Pending ? isLoadingPendingTransactions : isLoadingTransactions;
  // Determine which data to show based on tab
  const transactions = tab === ETransactionTab.Pending ? pendingTransactionsResponse?.data : transactionsResponse?.data;
  const pagination = tab === ETransactionTab.Pending ? pendingTransactionsResponse?.meta : transactionsResponse?.meta;
  return (
    <div className="space-y-6 md:space-y-8">
      <h1 className="text-2xl font-semibold">Transactions</h1>

      <Stats className="mb-1" />

      <div className="space-y-6">
        <div className="bg-background sticky top-0 z-10 mb-0 flex flex-col items-center justify-between gap-4 py-6 md:pt-8 lg:flex-row">
          <Tabs value={tab} onValueChange={(v) => handleChangeTab(v as ETransactionTab)} className="w-full">
            <TabsList className="w-full lg:w-fit">
              <TabsTrigger value={ETransactionTab.Validated} disabled={isLoading}>
                Validated
              </TabsTrigger>
              <TabsTrigger value={ETransactionTab.Pending} disabled={isLoading}>
                Pending
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Pagination
            page={page}
            limit={limit}
            totalPages={pagination?.total_pages ?? 0}
            totalItems={pagination?.total_items ?? 0}
            isLoading={isLoading}
            className="w-full lg:w-auto"
            onChangePage={handleChangePage}
            onChangeLimit={handleChangeLimit}
          />
        </div>

        <TransactionCollection transactions={transactions} isLoading={isLoading} />
      </div>
    </div>
  );
};
