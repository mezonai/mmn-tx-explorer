import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination } from '@/components/ui/pagination';
import { useState } from 'react';
import { useBreakpoint, usePaginationQueryParam } from '@/hooks';
import { EBreakpoint, ESortOrder } from '@/enums';
import { WalletTransactionsTable, WalletTransactionsCards } from '@/modules/transaction/components';
import { PAGINATION } from '@/constant';
import { ITransactionListParams } from '@/modules/transaction';
import { useTransactions } from '@/modules/transaction/hooks/useTransactions';
import { computeDateRange } from '@/modules/wallet/utils';

interface TransactionHistoryCardProps {
  walletAddress: string;
}
const DEFAULT_VALUE_DATA_SEARCH: ITransactionListParams = {
  page: PAGINATION.DEFAULT_PAGE,
  limit: PAGINATION.DEFAULT_LIMIT,
  sort_by: 'transaction_timestamp',
  sort_order: ESortOrder.DESC,
} as const;
export function TransactionHistoryCard({ walletAddress }: TransactionHistoryCardProps) {
  const { page, limit, handleChangePage, handleChangeLimit } = usePaginationQueryParam();
  const [filters, setFilters] = useState({
    period: 'Last 3 months',
    type: 'All Transaction',
  });
  const getSearchParams = (): ITransactionListParams => {
    const base = {
      ...DEFAULT_VALUE_DATA_SEARCH,
      page,
      limit,
    };

    const dateRange = computeDateRange(filters.period);
    const baseWithDate = { ...base, ...dateRange };

    if (filters.type === 'Sent') {
      return { ...baseWithDate, filter_from_address: walletAddress };
    }
    if (filters.type === 'Received') {
      return { ...baseWithDate, filter_to_address: walletAddress };
    }
    return { ...baseWithDate, wallet_address: walletAddress };
  };

  const searchParams: ITransactionListParams = getSearchParams();
  const handleFilterChange = (filterType: 'type' | 'period', value: string) => {
    setFilters((prevFilters) => ({ ...prevFilters, [filterType]: value }));
  };
  const isDesktop = useBreakpoint(EBreakpoint.LG);
  const { data: transactionsResponse, isLoading: isLoadingTransactions } = useTransactions(searchParams);
  const transactions = transactionsResponse?.data;
  const pagination = transactionsResponse?.meta;
  const isEmptyTransactions = transactions && transactions.length === 0;

  return (
    <Card className="dark:border-primary/20">
      <CardContent className="overflow-x-hidden px-2">
        <CardHeader className="mb-4 flex items-center justify-between gap-2 p-0">
          <CardTitle className="text-brand-primary font-semibold tracking-wider uppercase">
            Transaction history
          </CardTitle>
        </CardHeader>
        <div className="bg-card top-0 z-10 mb-0 flex flex-col gap-4 py-6 md:pt-8 lg:flex-row lg:items-center lg:justify-end lg:gap-5">
          <div className="flex w-full flex-col gap-4 sm:flex-row lg:w-auto">
            <Select value={filters.period} onValueChange={(v) => handleFilterChange('period', v)}>
              <SelectTrigger className="h-10 w-full sm:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Last 3 months">Last 3 months</SelectItem>
                <SelectItem value="Last 6 months">Last 6 months</SelectItem>
                <SelectItem value="Last 12 months">Last 12 months</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.type} onValueChange={(v) => handleFilterChange('type', v)}>
              <SelectTrigger className="h-10 w-full sm:w-[170px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Transaction">All Transaction</SelectItem>
                <SelectItem value="Sent">Sent</SelectItem>
                <SelectItem value="Received">Received</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Pagination
            page={page}
            limit={limit}
            totalPages={pagination?.total_pages ?? 0}
            totalItems={pagination?.total_items ?? 0}
            isLoading={isLoadingTransactions}
            className="w-full lg:w-auto"
            onChangePage={handleChangePage}
            onChangeLimit={handleChangeLimit}
          />
        </div>
        {isDesktop === undefined ? (
          <div>
            <div className="hidden lg:block">
              <WalletTransactionsTable
                walletAddress={walletAddress}
                transactions={transactions}
                isLoading={isLoadingTransactions}
              />
            </div>
            <div className="block lg:hidden">
              <WalletTransactionsCards
                isLoading={isLoadingTransactions}
                walletAddress={walletAddress}
                transactions={transactions ?? []}
                isEmptyTransactions={isEmptyTransactions}
              />
            </div>
          </div>
        ) : isDesktop ? (
          <WalletTransactionsTable
            walletAddress={walletAddress}
            transactions={transactions}
            isLoading={isLoadingTransactions}
          />
        ) : (
          <WalletTransactionsCards
            isLoading={isLoadingTransactions}
            walletAddress={walletAddress}
            transactions={transactions ?? []}
            isEmptyTransactions={isEmptyTransactions}
          />
        )}
      </CardContent>
    </Card>
  );
}
