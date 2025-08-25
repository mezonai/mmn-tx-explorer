'use client';

import { useEffect, useState } from 'react';

import { CreditCardRefresh, Cube01, Hourglass01, Wallet02 } from '@/assets/icons';
import { DashboardService } from '../../api';
import { IDashboardStats } from '../../type';
import { StatCard } from './stat-card';
import { StatCardSkeleton } from './stat-card-skeleton';

export const StatsGrid = () => {
  const [stats, setStats] = useState<IDashboardStats>();

  const handleFetchStats = async () => {
    try {
      const { data } = await DashboardService.getStats();
      setStats(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    handleFetchStats();
  }, []);

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats?.total_blocks === undefined ? (
        <StatCardSkeleton icon={Cube01} title="Total Blocks" />
      ) : (
        <StatCard icon={Cube01} title="Total Blocks" value={stats.total_blocks} />
      )}

      {stats?.total_transactions === undefined ? (
        <StatCardSkeleton icon={CreditCardRefresh} title="Total Transactions" />
      ) : (
        <StatCard icon={CreditCardRefresh} title="Total Transactions" value={stats.total_transactions} />
      )}

      {stats?.average_block_time === undefined ? (
        <StatCardSkeleton icon={Hourglass01} title="Average Block Time" />
      ) : (
        <StatCard icon={Hourglass01} title="Average Block Time" value={stats.average_block_time} />
      )}

      {stats?.total_wallets === undefined ? (
        <StatCardSkeleton icon={Wallet02} title="Total Wallet" />
      ) : (
        <StatCard icon={Wallet02} title="Total Wallet" value={stats.total_wallets} />
      )}
    </div>
  );
};
