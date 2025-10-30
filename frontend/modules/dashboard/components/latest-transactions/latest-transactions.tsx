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
    <div className={cn('space-y-4', className)}>
      <div>
        <h2 className="text-xl font-semibold">Latest Transactions</h2>
      </div>
      <div>
        <div className="hidden lg:block">
          <TransactionCardsDesktop
            transactions={transactions}
            skeletonLength={DASHBOARD_TRANSACTIONS_LIMIT}
            isLoading={isLoading}
          />
        </div>
        <div className="block lg:hidden">
          <TransactionCardsMobile
            transactions={transactions}
            skeletonLength={DASHBOARD_TRANSACTIONS_LIMIT}
            isLoading={isLoading}
          />
        </div>
      </div>
      <div className="flex w-full justify-center">
        <Button variant="link" className="text-brand-primary size-fit p-0 font-semibold" asChild>
          <Link href={ROUTES.TRANSACTIONS}>View all transactions</Link>
        </Button>
      </div>
    </div>
  );
};
