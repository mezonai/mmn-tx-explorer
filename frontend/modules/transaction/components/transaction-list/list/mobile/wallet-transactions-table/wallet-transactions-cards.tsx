'use client';

import { NoData } from '@/components/shared/no-data';
import { VirtualizedList } from '@/components/ui/virtualized-list';
import { WalletTransactionsCard } from './wallet-transactions-card';
import { ITransaction } from '@/modules/transaction/types';
import { PAGINATION } from '@/constant';
import { usePaginationQueryParam } from '@/hooks';

interface WalletTransactionsTableProps {
  walletAddress: string;
  isLoading: boolean;
  transactions: ITransaction[];
  skeletonLength?: number;
  isEmptyTransactions: boolean | undefined;
}

export const WalletTransactionsCards = ({
  walletAddress,
  transactions = [],
  skeletonLength = PAGINATION.DEFAULT_LIMIT,
  isLoading,
  isEmptyTransactions = false,
}: WalletTransactionsTableProps) => {
  const { page, limit } = usePaginationQueryParam();
  const MIN_ROWS_FOR_VIRTUALIZATION = 50;
  const ESTIMATE_ROW_HEIGHT = 150;
  const OVERSCAN = 8;
  const MAX_HEIGHT = 600;

  if (isEmptyTransactions) {
    return <NoData />;
  }

  return (
    <VirtualizedList
      key={`${page}-${limit}`}
      items={transactions}
      isLoading={isLoading}
      isEmpty={!transactions || transactions.length === 0}
      skeletonCount={skeletonLength}
      estimateSize={ESTIMATE_ROW_HEIGHT}
      overscan={OVERSCAN}
      maxHeight={MAX_HEIGHT}
      minItemsForVirtualization={MIN_ROWS_FOR_VIRTUALIZATION}
      getItemKey={(tx) => tx.hash}
      className="space-y-4"
      itemClassName=""
      renderItem={(tx, i) => <WalletTransactionsCard transaction={tx} index={i} walletAddress={walletAddress} />}
      renderSkeletonItem={(i) => (
        <WalletTransactionsCard transaction={undefined} index={i} walletAddress={walletAddress} key={i} />
      )}
      renderEmpty={() => <div className="space-y-4" />}
    />
  );
};
