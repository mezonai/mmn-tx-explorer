'use client';

import { useEffect, useState } from 'react';

import { DashboardService, IDashboardStats } from '@/modules/dashboard';
import { StatCard } from './stat-card';
import { StatCardSkeleton } from './stat-card-skeleton';

export const Stats = () => {
  const [stats, setStats] = useState<IDashboardStats>();

  const statCards = [
    {
      title: 'Transactions',
      value: stats?.total_transactions,
    },
    {
      title: 'Pending transactions',
      value: stats?.total_pending_transactions,
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
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {stats
        ? statCards.map((item) => <StatCard key={item.title} title={item.title} value={item.value ?? 0} />)
        : statCards.map((item) => <StatCardSkeleton key={item.title} />)}
    </div>
  );
};
