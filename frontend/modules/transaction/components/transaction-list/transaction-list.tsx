'use client';

import { useEffect, useState } from 'react';

import { Pagination } from '@/components/ui/pagination';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PAGINATION } from '@/constant';
import { ESortOrder } from '@/enums';
import { usePaginationQueryParam, useQueryParam } from '@/hooks';
import { ETransactionTab, ITransaction, ITransactionListParams, TransactionService } from '@/modules/transaction';
import { IPaginationMeta } from '@/types';
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
  const [localSearchParams, setLocalSearchParams] = useState<ITransactionListParams>();
  const { data: transactionsResponse, isLoading: isLoadingTransactions } = useTransactions(
    localSearchParams ?? DEFAULT_VALUE_DATA_SEARCH
  );
  const { data: pendingTransactionsResponse, isLoading: isLoadingPendingTransactions } = usePendingTransactions(
    localSearchParams ?? DEFAULT_VALUE_DATA_SEARCH
  );
  const [transactions, setTransactions] = useState<ITransaction[]>();
  const [pagination, setPagination] = useState<IPaginationMeta>();

  const { page, limit, handleChangePage, handleChangeLimit } = usePaginationQueryParam();
  const { value: tab, handleChangeValue: handleChangeTab } = useQueryParam<ETransactionTab>({
    queryParam: 'tab',
    defaultValue: ETransactionTab.Validated,
    clearParams: ['page'],
  });

  useEffect(() => {
    setLocalSearchParams({
      ...DEFAULT_VALUE_DATA_SEARCH,
      page,
      limit,
    });
  }, [page, limit]);

  useEffect(() => {
    if (!localSearchParams) return;
    if (tab === ETransactionTab.Pending) {
      setTransactions(pendingTransactionsResponse?.data);
      setPagination(pendingTransactionsResponse?.meta);
    } else {
      setTransactions(transactionsResponse?.data);
      setPagination(transactionsResponse?.meta);
    }
  }, [localSearchParams, tab, transactionsResponse, pendingTransactionsResponse]);

  return (
    <div className="space-y-6 md:space-y-8">
      <h1 className="text-2xl font-semibold">Transactions</h1>

      <Stats className="mb-1" />

      <div className="space-y-6">
        <div className="bg-background sticky top-0 z-10 mb-0 flex flex-col items-center justify-between gap-4 py-6 md:pt-8 lg:flex-row">
          <Tabs value={tab} onValueChange={(v) => handleChangeTab(v as ETransactionTab)} className="w-full">
            <TabsList className="w-full lg:w-fit">
              <TabsTrigger value={ETransactionTab.Validated} disabled={isLoadingTransactions}>
                Validated
              </TabsTrigger>
              <TabsTrigger value={ETransactionTab.Pending} disabled={isLoadingPendingTransactions}>
                Pending
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Pagination
            page={page}
            limit={limit}
            totalPages={pagination?.total_pages ?? 0}
            totalItems={pagination?.total_items ?? 0}
            isLoading={isLoadingTransactions || isLoadingPendingTransactions}
            className="w-full lg:w-auto"
            onChangePage={handleChangePage}
            onChangeLimit={handleChangeLimit}
          />
        </div>

        <TransactionCollection transactions={transactions} skeletonLength={limit} />
      </div>
    </div>
  );
};
