'use client';

import { useEffect, useState } from 'react';

import { cn } from '@/lib/utils';
import { TransactionService } from '@/modules/transaction/api';
import { ITransactionStats } from '@/modules/transaction/types';
import { NumberUtil } from '@/utils';
import { StatCard } from '@/components/shared';

interface StatsProps {
  className?: string;
}

export const Stats = ({ className }: StatsProps) => {
  const [stats, setStats] = useState<ITransactionStats>();

  const statCards = [
    {
      title: 'Transactions',
      value: stats?.transactions_24h,
      subValue: '(24h)',
    },
    {
      title: 'Pending transactions',
      value: stats?.pending_transactions_30m,
      subValue: '(30m)',
    },
  ];

  const handleFetchStats = async () => {
    try {
      const { data } = await TransactionService.getStats();
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
            <StatCard
              key={item.title}
              title={item.title}
              value={NumberUtil.formatWithCommas(item.value ?? 0)}
              subValue={item.subValue}
            />
          ))
        : statCards.map((item) => <StatCard key={item.title} title={item.title} subValue={item.subValue} />)}
    </div>
  );
};
