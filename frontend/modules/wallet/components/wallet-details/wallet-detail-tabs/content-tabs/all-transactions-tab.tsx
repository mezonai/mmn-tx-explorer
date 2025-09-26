import { Pagination } from '@/components/ui/pagination';
import { PAGINATION } from '@/constant';
import { EBreakpoint, ESortOrder } from '@/enums';
import { useBreakpoint, usePaginationQueryParam } from '@/hooks';
import { ETransactionTab, ITransactionListParams } from '@/modules/transaction';
import { WalletTransactionsCards, WalletTransactionsTable } from '@/modules/transaction/components';
import { useTransactions } from '@/modules/transaction/hooks/useTransactions';

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
  const { page, limit, handleChangePage, handleChangeLimit } = usePaginationQueryParam();
  const isDesktop = useBreakpoint(EBreakpoint.LG);

  // Create search params directly from URL params to avoid double useEffect
  const searchParams: ITransactionListParams = {
    ...DEFAULT_VALUE_DATA_SEARCH,
    page,
    limit,
    wallet_address: walletAddress,
  };

  const { data: transactionsResponse, isLoading: isLoadingTransactions } = useTransactions(searchParams);
  const transactions = transactionsResponse?.data;
  const pagination = transactionsResponse?.meta;
  const isEmptyTransactions = transactions && transactions.length === 0;
  return (
    <div>
      <div className="bg-background sticky top-0 z-10 mb-0 flex justify-end gap-5 py-6 md:pt-8">
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
    </div>
  );
};
