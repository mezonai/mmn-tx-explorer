'use client';

import { useEffect, useState } from 'react';

import { Pagination } from '@/components/ui/pagination';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PAGINATION } from '@/constant';
import { usePaginationQueryParam, useQueryParam } from '@/hooks';
import { ETransactionTab, ITransaction, ITransactionListParams, TransactionService } from '@/modules/transaction';
import { IPaginationMeta } from '@/types';
import { TransactionCollection } from './list/transaction-collection';
import { Stats } from './stats';

const DEFAULT_VALUE_DATA_SEARCH: ITransactionListParams = {
  page: PAGINATION.DEFAULT_PAGE,
  limit: PAGINATION.DEFAULT_LIMIT,
  sort_by: 'block_timestamp',
  sort_order: 'desc',
  tab: ETransactionTab.Validated,
} as const;

export const TransactionsList = () => {
  const [transactions, setTransactions] = useState<ITransaction[]>();
  const [pagination, setPagination] = useState<IPaginationMeta>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [localSearchParams, setLocalSearchParams] = useState<ITransactionListParams>();
  const { value: tab, handleChangeValue: handleChangeTab } = useQueryParam<ETransactionTab>({
    queryParam: 'tab',
    defaultValue: ETransactionTab.Validated,
    clearParams: ['page'],
  });
  const { page, limit, handleChangePage, handleChangeLimit } = usePaginationQueryParam();

  const handleFetchTransactions = async (params: ITransactionListParams) => {
    try {
      setIsLoading(true);
      setTransactions(undefined);

      // TODO: update API to support tab, then remove this
      const { tab: _omit, ...queryParams } = params;
      void _omit;

      const { data, meta } = await TransactionService.getTransactions({
        ...queryParams,
        page: queryParams.page - 1,
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
      tab,
    });
  }, [page, limit, tab]);

  useEffect(() => {
    if (!localSearchParams) return;
    handleFetchTransactions(localSearchParams);
  }, [localSearchParams]);

  return (
    <div className="space-y-8">
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Transactions</h1>
      </div>

      <Stats className="mb-0" />

      <div className="space-y-6">
        <div className="bg-background sticky top-0 z-10 mb-0 flex flex-col items-center justify-between gap-5 pt-8 pb-6 lg:flex-row">
          <Tabs value={tab} onValueChange={(v) => handleChangeTab(v as ETransactionTab)} className="w-full">
            <TabsList className="w-full lg:w-fit">
              <TabsTrigger
                value={ETransactionTab.Validated}
                disabled={isLoading}
                className="flex-1 px-3 py-2 lg:flex-none"
              >
                Validated
              </TabsTrigger>
              <TabsTrigger
                value={ETransactionTab.Pending}
                disabled={isLoading}
                className="flex-1 px-3 py-2 lg:flex-none"
              >
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
            className="self-end"
            onChangePage={handleChangePage}
            onChangeLimit={handleChangeLimit}
          />
        </div>

        <TransactionCollection transactions={transactions} skeletonLimit={limit} />
      </div>
    </div>
  );
};
