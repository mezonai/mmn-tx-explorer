'use client';

import { useEffect, useState } from 'react';

import { CreditCardRefresh, Cube01, Hourglass01, Wallet02 } from '@/assets/icons';
import { DashboardService } from '../../api';
import { IDashboardStats } from '../../type';
import { StatCard } from './stat-card';

export const Stats = () => {
  const [stats, setStats] = useState<IDashboardStats>();

  const statCards = [
    {
      icon: Cube01,
      title: 'Total Blocks',
      value: stats?.total_blocks,
    },
    {
      icon: CreditCardRefresh,
      title: 'Total Transactions',
      value: stats?.total_transactions,
    },
    {
      icon: Hourglass01,
      title: 'Average Block Time',
      value: stats?.average_block_time,
      subValue: '(s)',
    },
    {
      icon: Wallet02,
      title: 'Total Wallet',
      value: stats?.total_wallets,
    },
  ];

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
      {statCards.map((item) => (
        <StatCard key={item.title} icon={item.icon} title={item.title} value={item.value} subValue={item.subValue} />
      ))}
    </div>
  );
};
