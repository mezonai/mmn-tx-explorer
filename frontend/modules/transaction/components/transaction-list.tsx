'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { ArrowLeft, ArrowRight } from '@/assets/icons';
import { Button } from '@/components/ui/button';
import { GlobalSearch } from '@/modules/global-search';
import { ITransaction, ITransactionListParams, TransactionService } from '@/modules/transaction';
import { IPaginationMeta } from '@/types';
import { TransactionCards, TransactionsTable } from './list';
import { StatsGrid } from './stats';

const DEFAULT_VALUE_DATA_SEARCH: ITransactionListParams = {
  page: 1,
  limit: 20,
  sort_by: 'block_timestamp',
  sort_order: 'desc',
} as const;

export const TransactionsList = () => {
  const urlSearchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'validated' | 'pending' | 'blob'>('validated');
  const [transactions, setTransactions] = useState<ITransaction[]>();
  const [pagination, setPagination] = useState<IPaginationMeta>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [localSearchParams, setLocalSearchParams] = useState<ITransactionListParams>();

  const handleFetchTransactions = async (params: ITransactionListParams) => {
    try {
      setIsLoading(true);
      setTransactions(undefined);
      const { data, meta } = await TransactionService.getTransactions(params);
      setTransactions(data);
      setPagination(meta);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePage = (page: number) => {
    if (!pagination?.total_pages) return;
    if (page >= 1 && page <= pagination.total_pages) {
      const currentParams = new URLSearchParams(urlSearchParams.toString());
      currentParams.set('page', page.toString());
      const newUrl = `${window.location.pathname}?${currentParams.toString()}`;
      window.history.pushState(null, '', newUrl);
    }
  };

  useEffect(() => {
    setLocalSearchParams({
      ...DEFAULT_VALUE_DATA_SEARCH,
      page: Number(urlSearchParams.get('page')) || 1,
    });
  }, [urlSearchParams]);

  useEffect(() => {
    if (!localSearchParams) return;
    handleFetchTransactions(localSearchParams);
  }, [localSearchParams]);

  return (
    <div className="space-y-8">
      <div className="space-y-6">
        <GlobalSearch />
        <h1 className="text-2xl font-semibold">Transactions</h1>
      </div>

      <StatsGrid />

      <div className="space-y-6">
        <div className="flex flex-col items-center justify-between gap-5 md:flex-row">
          <div className="bg-muted flex items-center gap-1 self-start rounded-md p-1">
            <Button
              variant={activeTab === 'validated' ? 'outline' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('validated')}
              className="border border-transparent px-3 py-2"
              disabled={isLoading}
            >
              Validated
            </Button>
            <Button
              variant={activeTab === 'pending' ? 'outline' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('pending')}
              className="border border-transparent px-3 py-2"
              disabled={isLoading}
            >
              Pending
            </Button>
            <Button
              variant={activeTab === 'blob' ? 'outline' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('blob')}
              className="border border-transparent px-3 py-2"
              disabled={isLoading}
            >
              Blob txns
            </Button>
          </div>
          <div className="flex items-center gap-2 self-end">
            <Button
              variant="outline"
              className="px-3.5 py-2.5 text-sm font-semibold"
              onClick={() => handleChangePage(1)}
              disabled={isLoading}
            >
              First
            </Button>
            <div className="flex">
              <Button
                variant="outline"
                className="rounded-tr-none rounded-br-none p-2.5"
                onClick={() => localSearchParams && handleChangePage(localSearchParams.page - 1)}
                disabled={isLoading}
              >
                <ArrowLeft className="text-muted-foreground size-5" />
              </Button>
              <div className="bg-primary/8 flex aspect-square h-[37px] items-center justify-center">
                <p className="text-foreground text-sm font-semibold">{localSearchParams?.page ?? 1}</p>
              </div>
              <Button
                variant="outline"
                className="rounded-tl-none rounded-bl-none p-2.5"
                onClick={() => localSearchParams && handleChangePage(localSearchParams.page + 1)}
                disabled={isLoading}
              >
                <ArrowRight className="text-muted-foreground size-5" />
              </Button>
            </div>
          </div>
        </div>

        <>
          <div className="hidden lg:block">
            <TransactionsTable transactions={transactions} />
          </div>

          <div className="space-y-4 lg:hidden">
            <TransactionCards transactions={transactions} />
          </div>
        </>
      </div>
    </div>
  );
};
