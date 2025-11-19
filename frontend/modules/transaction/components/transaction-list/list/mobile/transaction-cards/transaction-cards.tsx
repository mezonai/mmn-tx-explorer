'use client';

import { PAGINATION } from '@/constant';
import { VirtualizedList } from '@/components/ui/virtualized-list';
import { ITransaction } from '@/modules/transaction';
import { TransactionCard } from './transaction-card';
import { usePaginationQueryParam } from '@/hooks';

interface TransactionCardsProps {
  transactions?: ITransaction[];
  skeletonLength?: number;
  isLoading: boolean;
}

export const TransactionCardsMobile = ({
  transactions,
  skeletonLength = PAGINATION.DEFAULT_LIMIT,
  isLoading,
}: TransactionCardsProps) => {
  const { page, limit } = usePaginationQueryParam();
  return (
    <VirtualizedList
      key={`${page}-${limit}`}
      items={transactions}
      isLoading={isLoading}
      isEmpty={!transactions || transactions.length === 0}
      skeletonCount={skeletonLength}
      estimateSize={150}
      overscan={8}
      maxHeight={600}
      minItemsForVirtualization={50}
      getItemKey={(tx) => tx.hash}
      className="space-y-4"
      itemClassName="py-2"
      renderItem={(tx) => <TransactionCard transaction={tx} />}
      renderSkeletonItem={(i) => <TransactionCard key={i} />}
      renderEmpty={() => <div className="space-y-4" />}
    />
  );
};
