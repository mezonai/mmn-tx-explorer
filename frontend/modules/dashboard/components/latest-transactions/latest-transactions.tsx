'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { ROUTES } from '@/configs/routes.config';
import { DEFAULT_PAGINATION } from '@/constant';
import {
  DASHBOARD_TRANSACTIONS_LIMIT,
  ITransaction,
  ITransactionListParams,
  TransactionService,
} from '@/modules/transaction';
import { TransactionCards } from '@/modules/transaction/components/list';

const DEFAULT_VALUE_DATA_SEARCH: ITransactionListParams = {
  page: DEFAULT_PAGINATION.PAGE,
  limit: DASHBOARD_TRANSACTIONS_LIMIT,
  sort_by: 'block_timestamp',
  sort_order: 'desc',
} as const;

export const LatestTransactions = () => {
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
    <div className="col-span-1 space-y-4 xl:col-span-6">
      <div>
        <h2 className="text-xl font-semibold">Latest Transactions</h2>
      </div>
      <div className="space-y-4">
        {<TransactionCards transactions={transactions} skeletonLimit={DASHBOARD_TRANSACTIONS_LIMIT} />}
      </div>
      <div className="flex w-full justify-center">
        <Button variant="link" className="font-medium" asChild>
          <Link href={ROUTES.TRANSACTIONS}>View all transactions</Link>
        </Button>
      </div>
    </div>
  );
};
