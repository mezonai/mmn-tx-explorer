'use client';

import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { ROUTES } from '@/configs/routes.config';
import { cn } from '@/lib/utils';
import { DASHBOARD_TRANSACTIONS_LIMIT } from '@/modules/transaction';
import { TransactionCardsMobile, TransactionCardsDesktop } from '@/modules/transaction/components';
import { useLatestTransactions } from '../../hooks/useLatestTransactions';

interface LatestTransactionsProps {
  className?: string;
}

export const LatestTransactions = ({ className }: LatestTransactionsProps) => {
  const { data: transactionsResponse, isLoading } = useLatestTransactions();
  const transactions = transactionsResponse?.data;
  return (
    <div className={cn('bg-card dark:bg-[#1e293b] border border-gray-300 dark:border-gray-700 rounded-xl h-full flex flex-col', className)}>
      <div className="p-6 border-b border-gray-300 dark:border-gray-700 flex justify-between items-center flex-shrink-0">
        <h3 className="text-lg font-semibold">Latest Transactions</h3>
          <Button variant="link" className="text-[rgb(105,65,198)] size-fit p-0 text-sm hover:opacity-80 font-normal" asChild>
          <Link href={ROUTES.TRANSACTIONS}>View all</Link>
        </Button>
      </div>
      
      <div className="p-6 space-y-4 flex-1">
        <div className="hidden lg:block space-y-4">
          <TransactionCardsDesktop
            transactions={transactions}
            skeletonLength={DASHBOARD_TRANSACTIONS_LIMIT}
            isLoading={isLoading}
          />
        </div>
        <div className="block lg:hidden space-y-4">
          <TransactionCardsMobile
            transactions={transactions}
            skeletonLength={DASHBOARD_TRANSACTIONS_LIMIT}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
};
