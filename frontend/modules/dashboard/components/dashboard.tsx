'use client';

import { useEffect, useState } from 'react';

import { BlockService, IBlock, IBLockListParams } from '@/modules/block';
import { GlobalSearch } from '@/modules/global-search';
import { ITransaction, ITransactionListParams, TransactionService } from '@/modules/transaction';
import { LatestBlocks } from './latest-blocks';
import { LatestTransactions } from './latest-transactions';
import { StatsGrid } from './stats';

const DEFAULT_BLOCKS_VALUE_DATA_SEARCH: IBLockListParams = {
  page: 1,
  limit: 3,
  sort_by: 'block_number',
  sort_order: 'desc',
} as const;

const DEFAULT_TRANSACTIONS_VALUE_DATA_SEARCH: ITransactionListParams = {
  page: 1,
  limit: 7,
  sort_by: 'block_timestamp',
  sort_order: 'desc',
} as const;

export const Dashboard = () => {
  const [blocks, setBlocks] = useState<IBlock[]>();
  const [transactions, setTransactions] = useState<ITransaction[]>();

  const handleFetchBlocks = async () => {
    try {
      const { data } = await BlockService.getBlocks(DEFAULT_BLOCKS_VALUE_DATA_SEARCH);
      setBlocks(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleFetchTransactions = async () => {
    try {
      const { data } = await TransactionService.getTransactions(DEFAULT_TRANSACTIONS_VALUE_DATA_SEARCH);
      setTransactions(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    handleFetchBlocks();
    handleFetchTransactions();
  }, []);

  return (
    <div className="space-y-8">
      <div className="space-y-5">
        <GlobalSearch />
        <h1 className="text-2xl font-semibold">Dashboard</h1>
      </div>

      <StatsGrid />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-9">
        <LatestBlocks blocks={blocks} />
        <LatestTransactions transactions={transactions} />
      </div>
    </div>
  );
};
