import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination } from '@/components/ui/pagination';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useBreakpoint, usePaginationQueryParam } from '@/hooks';
import { EBreakpoint, ESortOrder } from '@/enums';
import { WalletTransactionsTable, WalletTransactionsCards } from '@/modules/transaction/components';
import { PAGINATION } from '@/constant';
import { ITransactionListParams } from '@/modules/transaction';
import { useTransactions } from '@/modules/transaction/hooks/useTransactions';
import { DatePicker } from '@/components/ui/datepicker';
import { ExportTransactionsModal } from '@/components/ExportTransactionsModal';
import { exportTransactionsToCSV } from '@/utils/export-csv';
import { toast } from 'sonner';
import { DateTimeUtil } from '@/utils';
import { Download } from 'lucide-react';

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

export function TransactionHistoryCard({ walletAddress }: TransactionHistoryCardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [showExportModal, setShowExportModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFromDate, setExportFromDate] = useState<Date | null>(null);
  const [exportToDate, setExportToDate] = useState<Date | null>(null);
  const urlSearchParams = useSearchParams();
  const { page, limit, handleChangePage, handleChangeLimit } = usePaginationQueryParam();
  const [startDate, setStartDate] = useState<Date>(getDefaultTimeRangeByMonth(1));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [transactionType, setTransactionType] = useState('All Transaction');
  const oneYearAgo = new Date(new Date().setFullYear(new Date().getFullYear() - 1));
  const today = new Date();
  useEffect(() => {
    const typeParam = urlSearchParams.get('type');
    if (typeParam === 'received') {
      setTransactionType('Received');
    } else if (typeParam === 'sent') {
      setTransactionType('Sent');
    }
  }, [urlSearchParams]);
  const getSearchParams = (): ITransactionListParams => {
    const base = {
      ...DEFAULT_VALUE_DATA_SEARCH,
      page,
      limit,
    };

    const baseWithDate = {
      ...base,
      start_time: DateTimeUtil.formatLocalDate(startDate),
      end_time: DateTimeUtil.formatLocalDate(endDate),
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
  useEffect(() => {
    if (!isLoadingTransactions && pagination) {
      const totalPages = pagination.total_pages;

      if (totalPages > 0 && page > totalPages) {
        const currentParams = new URLSearchParams(urlSearchParams.toString());
        currentParams.set('page', totalPages.toString());
        router.replace(`${pathname}?${currentParams.toString()}`);
      }
    }
  }, [pagination, page, isLoadingTransactions, router, pathname, urlSearchParams]);
  const handleExportWithRange = async (fromDate: Date | null, toDate: Date | null, filename?: string) => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      await exportTransactionsToCSV(
        walletAddress,
        fromDate,
        toDate,
        filename || `${walletAddress}-transactions-range.csv`
      );
      setShowExportModal(false);
    } catch (error) {
      toast.error('Failed to export transactions as CSV. ' + String(error));
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportAll = async () => {
    await handleExportWithRange(null, null, `${walletAddress}-transactions-all.csv`);
  };

  return (
    <Card className="dark:border-primary/20">
      <CardContent className="overflow-x-hidden">
        <CardHeader className="mb-4 flex items-center justify-between gap-2 p-0">
          <CardTitle className="text-primary font-semibold tracking-wider uppercase">Transaction history</CardTitle>
        </CardHeader>
        <div className="top-0 mb-0 flex flex-col gap-4 py-6 md:pt-8 lg:flex-row lg:items-center lg:justify-between lg:gap-5">
          <div className="flex w-full items-center justify-center sm:w-auto sm:justify-start">
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
                  <Download className="mr-2 h-4 w-4" />
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
          <div className="flex w-full flex-col gap-4 sm:flex-row lg:w-auto">
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
