'use client';

import { useEffect, useState } from 'react';

import { DEFAULT_PAGINATION } from '@/constant';
import { BlockService, DASHBOARD_BLOCKS_LIMIT, IBlock, IBLockListParams } from '@/modules/block';
import {
  DASHBOARD_TRANSACTIONS_LIMIT,
  ITransaction,
  ITransactionListParams,
  TransactionService,
} from '@/modules/transaction';
import { LatestBlocks } from './latest-blocks';
import { LatestTransactions } from './latest-transactions';
import { StatsGrid } from './stats';

const DEFAULT_BLOCKS_VALUE_DATA_SEARCH: IBLockListParams = {
  page: DEFAULT_PAGINATION.PAGE,
  limit: DASHBOARD_BLOCKS_LIMIT,
  sort_by: 'block_number',
  sort_order: 'desc',
} as const;

const DEFAULT_TRANSACTIONS_VALUE_DATA_SEARCH: ITransactionListParams = {
  page: DEFAULT_PAGINATION.PAGE,
  limit: DASHBOARD_TRANSACTIONS_LIMIT,
  sort_by: 'block_timestamp',
  sort_order: 'desc',
} as const;

export const Dashboard = () => {
  const [blocks, setBlocks] = useState<IBlock[]>();
  const [transactions, setTransactions] = useState<ITransaction[]>();
  const [totalBlocks, setTotalBlocks] = useState<number>();
  const [totalTransactions, setTotalTransactions] = useState<number>();

  const handleFetchBlocks = async () => {
    try {
      const { data, meta } = await BlockService.getBlocks(DEFAULT_BLOCKS_VALUE_DATA_SEARCH);
      setBlocks(data);
      setTotalBlocks(meta.total_items);
    } catch (error) {
      console.error(error);
    }
  };

  const handleFetchTransactions = async () => {
    try {
      const { data, meta } = await TransactionService.getTransactions(DEFAULT_TRANSACTIONS_VALUE_DATA_SEARCH);
      setTransactions(data);
      setTotalTransactions(meta.total_items);
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
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <StatsGrid
        totalBlocks={totalBlocks}
        totalTransactions={totalTransactions}
        averageBlockTime={96}
        totalWallet={96}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-9">
        <LatestBlocks blocks={blocks} />
        <LatestTransactions transactions={transactions} />
      </div>
    </div>
  );
};
