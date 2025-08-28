'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { ROUTES } from '@/configs/routes.config';
import { ESortOrder } from '@/enums';
import { cn } from '@/lib/utils';
import {
  DASHBOARD_TRANSACTIONS_LIMIT,
  ITransaction,
  ITransactionListParams,
  TransactionService,
} from '@/modules/transaction';
import { TransactionCardsMobile, TransactionCardsDesktop } from '@/modules/transaction/components';

interface LatestTransactionsProps {
  className?: string;
}

const DEFAULT_VALUE_DATA_SEARCH: ITransactionListParams = {
  page: 0,
  limit: DASHBOARD_TRANSACTIONS_LIMIT,
  sort_by: 'block_timestamp',
  sort_order: ESortOrder.DESC,
} as const;

export const LatestTransactions = ({ className }: LatestTransactionsProps) => {
  const [transactions, setTransactions] = useState<ITransaction[]>();

  const handleFetchTransactions = async () => {
    try {
      const { data } = await TransactionService.getTransactions(DEFAULT_VALUE_DATA_SEARCH);
      setTransactions(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    handleFetchTransactions();
  }, []);

  return (
    <div className={cn('space-y-4', className)}>
      <div>
        <h2 className="text-xl font-semibold">Latest Transactions</h2>
      </div>
      <div>
        <div className="hidden lg:block">
          <TransactionCardsDesktop transactions={transactions} skeletonLength={DASHBOARD_TRANSACTIONS_LIMIT} />
        </div>
        <div className="block lg:hidden">
          <TransactionCardsMobile transactions={transactions} skeletonLength={DASHBOARD_TRANSACTIONS_LIMIT} />
        </div>
      </div>
      <div className="flex w-full justify-center">
        <Button variant="link" className="text-brand-secondary-700 size-fit p-0 font-semibold" asChild>
          <Link href={ROUTES.TRANSACTIONS}>View all transactions</Link>
        </Button>
      </div>
    </div>
  );
};
