'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Pagination } from '@/components/ui/pagination';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DEFAULT_PAGINATION } from '@/constant';
import { EBreakpoint } from '@/enums';
import { useBreakpoint } from '@/hooks';
import { ETransactionTab, ITransaction, ITransactionListParams, TransactionService } from '@/modules/transaction';
import { IPaginationMeta } from '@/types';
import { TransactionCards, TransactionsTable } from './list';
import { StatsGrid } from './stats';

const DEFAULT_VALUE_DATA_SEARCH: ITransactionListParams = {
  page: DEFAULT_PAGINATION.PAGE,
  limit: DEFAULT_PAGINATION.LIMIT,
  sort_by: 'block_timestamp',
  sort_order: 'desc',
  tab: ETransactionTab.Validated,
} as const;

export const TransactionsList = () => {
  const urlSearchParams = useSearchParams();
  const isDesktop = useBreakpoint(EBreakpoint.LG);
  const [transactions, setTransactions] = useState<ITransaction[]>();
  const [pagination, setPagination] = useState<IPaginationMeta>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [localSearchParams, setLocalSearchParams] = useState<ITransactionListParams>();

  const handleFetchTransactions = async (params: ITransactionListParams) => {
    try {
      setIsLoading(true);
      setTransactions(undefined);

      // TODO: update API to support tab, then remove this
      const { tab: _omit, ...queryParams } = params;
      void _omit;

      const { data, meta } = await TransactionService.getTransactions(queryParams);
      setTransactions(data);
      setPagination(meta);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSearchParam = (key: 'page' | 'tab', value: string | number) => {
    const currentParams = new URLSearchParams(urlSearchParams.toString());
    currentParams.set(key, String(value));
    const newUrl = `${window.location.pathname}?${currentParams.toString()}`;
    window.history.pushState(null, '', newUrl);
  };

  const handleChangePage = (page: number) => updateSearchParam('page', page);
  const handleChangeTab = (tab: ETransactionTab) => updateSearchParam('tab', tab);

  useEffect(() => {
    setLocalSearchParams({
      ...DEFAULT_VALUE_DATA_SEARCH,
      page: Number(urlSearchParams.get('page')) || DEFAULT_PAGINATION.PAGE,
      tab: (urlSearchParams.get('tab') as ETransactionTab | undefined) || ETransactionTab.Validated,
    });
  }, [urlSearchParams]);

  useEffect(() => {
    if (!localSearchParams) return;
    handleFetchTransactions(localSearchParams);
  }, [localSearchParams]);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Transactions</h1>

      <StatsGrid />

      <div className="space-y-6">
        <div className="flex flex-col items-center justify-between gap-5 md:flex-row">
          <Tabs
            value={localSearchParams?.tab ?? ETransactionTab.Validated}
            onValueChange={(v) => handleChangeTab(v as ETransactionTab)}
            className="w-full"
          >
            <TabsList className="w-full md:w-fit">
              <TabsTrigger
                value={ETransactionTab.Validated}
                disabled={isLoading}
                className="flex-1 px-3 py-2 md:flex-none"
              >
                Validated
              </TabsTrigger>
              <TabsTrigger
                value={ETransactionTab.Pending}
                disabled={isLoading}
                className="flex-1 px-3 py-2 md:flex-none"
              >
                Pending
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Pagination
            page={localSearchParams?.page ?? DEFAULT_PAGINATION.PAGE}
            totalPages={pagination?.total_pages ?? DEFAULT_PAGINATION.PAGE}
            isLoading={isLoading}
            className="self-end"
            onChangePage={handleChangePage}
          />
        </div>

        <>
          {isDesktop === undefined ? (
            <>
              <div className="hidden lg:block">
                <TransactionsTable transactions={transactions} />
              </div>
              <div className="block lg:hidden">
                <TransactionCards transactions={transactions} />
              </div>
            </>
          ) : isDesktop ? (
            <TransactionsTable transactions={transactions} />
          ) : (
            <TransactionCards transactions={transactions} />
          )}
        </>
      </div>
    </div>
  );
};
