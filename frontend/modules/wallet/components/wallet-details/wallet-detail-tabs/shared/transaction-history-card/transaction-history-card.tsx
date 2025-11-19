import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination } from '@/components/ui/pagination';
import { useState } from 'react';
import { useBreakpoint, usePaginationQueryParam } from '@/hooks';
import { EBreakpoint, ESortOrder } from '@/enums';
import { WalletTransactionsTable, WalletTransactionsCards } from '@/modules/transaction/components';
import { PAGINATION } from '@/constant';
import { ITransactionListParams } from '@/modules/transaction';
import { useTransactions } from '@/modules/transaction/hooks/useTransactions';
import { DatePicker } from '@/components/ui/datepicker';
import { ExportTransactionsModal } from '@/components/ExportTransactionsModal';
import { exportTransactionsToCSV } from '@/utils/export-csv';
import { TransactionService } from '@/modules/transaction/api';

interface TransactionHistoryCardProps {
  walletAddress: string;
}

const DEFAULT_VALUE_DATA_SEARCH: ITransactionListParams = {
  page: PAGINATION.DEFAULT_PAGE,
  limit: PAGINATION.DEFAULT_LIMIT,
  sort_by: 'transaction_timestamp',
  sort_order: ESortOrder.DESC,
} as const;

const getDefaultTimeRangeByMonth = (monthRange: number) => {
  const today = new Date();
  const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - monthRange, today.getDate());
  return threeMonthsAgo;
};

const formatLocalDate = (date: Date) => {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().split('T')[0];
};

export function TransactionHistoryCard({ walletAddress }: TransactionHistoryCardProps) {
  const [showExportModal, setShowExportModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false); // Added loading state for export
  const [exportFromDate, setExportFromDate] = useState<Date | null>(null);
  const [exportToDate, setExportToDate] = useState<Date | null>(null);

  const { page, limit, handleChangePage, handleChangeLimit } = usePaginationQueryParam();
  const [startDate, setStartDate] = useState<Date>(getDefaultTimeRangeByMonth(1));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [transactionType, setTransactionType] = useState('All Transaction');
  const oneYearAgo = new Date(new Date().setFullYear(new Date().getFullYear() - 1));
  const today = new Date();

  const getSearchParams = (): ITransactionListParams => {
    const base = {
      ...DEFAULT_VALUE_DATA_SEARCH,
      page,
      limit,
    };

    const baseWithDate = {
      ...base,
      start_time: formatLocalDate(startDate),
      end_time: formatLocalDate(endDate),
    };

    if (transactionType === 'Sent') {
      return { ...baseWithDate, filter_from_address: walletAddress };
    }
    if (transactionType === 'Received') {
      return { ...baseWithDate, filter_to_address: walletAddress };
    }
    return { ...baseWithDate, wallet_address: walletAddress };
  };

  const searchParams: ITransactionListParams = getSearchParams();

  const isDesktop = useBreakpoint(EBreakpoint.LG);
  const { data: transactionsResponse, isLoading: isLoadingTransactions } = useTransactions(searchParams);
  const transactions = transactionsResponse?.data;
  const pagination = transactionsResponse?.meta;
  const isEmptyTransactions = transactions && transactions.length === 0;

  const fetchAllTransactions = async (params: ITransactionListParams) => {
    let allTxs: Record<string, unknown>[] = [];
    let currentPage = 0;
    while (true) {
      const response = await TransactionService.getTransactions({ ...params, page: currentPage });
      const txs = (response.data ?? []) as unknown as Record<string, unknown>[];
      if (!txs.length) break;
      allTxs = allTxs.concat(txs);
      currentPage++;
    }
    return allTxs;
  };

  const handleExportWithRange = async (fromDate: Date | null, toDate: Date | null, filename?: string) => {
    if (isExporting) return;
    setIsExporting(true);
    const baseParams: ITransactionListParams = { ...getSearchParams(), page: 1, limit: 1000 };
    if (fromDate) baseParams.start_time = formatLocalDate(fromDate);
    if (toDate) baseParams.end_time = formatLocalDate(toDate);
    try {
      const allTxs = await fetchAllTransactions(baseParams);
      if (allTxs.length === 0) {
        return;
      } else {
        exportTransactionsToCSV(allTxs, filename || `${walletAddress}-transactions-range.csv`);
        setShowExportModal(false);
      }
    } catch (error) {
      alert('Failed to fetch all transactions for export.' + error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportAll = async () => {
    const baseParams: ITransactionListParams = { ...getSearchParams(), page: 1, limit: 1000 };
    delete baseParams.start_time;
    delete baseParams.end_time;
    await handleExportWithRange(null, null, `${walletAddress}-transactions-all.csv`);
  };

  return (
    <Card className="dark:border-primary/20">
      <CardContent className="overflow-x-hidden">
        <CardHeader className="mb-4 flex items-center justify-between gap-2 p-0">
          <CardTitle className="text-primary font-semibold tracking-wider uppercase">Transaction history</CardTitle>
        </CardHeader>
        <div className="top-0 mb-0 flex flex-col gap-4 py-6 md:pt-8 lg:flex-row lg:items-center lg:justify-between lg:gap-5">
          <div className="flex items-center">
            <Button
              type="button"
              disabled={isExporting}
              className={`bg-brand-primary hover:bg-brand-primary/80 dark:hover:bg-brand-primary/90 mr-4 inline-flex items-center text-white ${
                isExporting ? 'cursor-not-allowed opacity-70' : ''
              }`}
              onClick={() => setShowExportModal(true)}
            >
              {isExporting ? (
                <span className="mr-2 animate-pulse">Exporting...</span>
              ) : (
                <>
                  <i className="fa-solid fa-file-csv mr-2"></i>
                  Export to CSV
                </>
              )}
            </Button>
            <ExportTransactionsModal
              show={showExportModal}
              onClose={() => !isExporting && setShowExportModal(false)}
              onExportRange={handleExportWithRange}
              onExportAll={handleExportAll}
              exportFromDate={exportFromDate}
              exportToDate={exportToDate}
              setExportFromDate={setExportFromDate}
              setExportToDate={setExportToDate}
            />
          </div>
          <div className="flex w-full flex-col items-center gap-4 sm:flex-row lg:w-auto">
            <DatePicker
              selected={startDate}
              onChange={(date) => date && setStartDate(date)}
              maxDate={endDate}
              minDate={oneYearAgo}
              className="bg-card h-10 w-full sm:w-[170px]"
              placeholder="Start date"
            />
            <DatePicker
              selected={endDate}
              onChange={(date) => date && setEndDate(date)}
              minDate={startDate}
              maxDate={today}
              className="bg-card h-10 w-full sm:w-[170px]"
              placeholder="End date"
            />

            <Select value={transactionType} onValueChange={setTransactionType}>
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
