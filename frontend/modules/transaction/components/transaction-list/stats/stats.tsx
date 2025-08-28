'use client';

import { useEffect, useState } from 'react';

import { cn } from '@/lib/utils';
import { DashboardService, IDashboardStats } from '@/modules/dashboard';
import { StatCard } from './stat-card';

interface StatsProps {
  className?: string;
}

export const Stats = ({ className }: StatsProps) => {
  const [stats, setStats] = useState<IDashboardStats>();

  const statCards = [
    {
      title: 'Transactions',
      value: stats?.transactions_24h ?? 0,
      subValue: '(24h)',
    },
    {
      title: 'Pending transactions',
      value: stats?.pending_transactions_30m ?? 0,
      subValue: '(30m)',
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
    <div className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2', className)}>
      {stats
        ? statCards.map((item) => (
            <StatCard key={item.title} title={item.title} value={item.value} subValue={item.subValue} />
          ))
        : statCards.map((item) => <StatCard key={item.title} title={item.title} subValue={item.subValue} />)}
    </div>
  );
};
