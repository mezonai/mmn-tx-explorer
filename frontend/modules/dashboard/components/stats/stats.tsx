'use client';

import { StatCard } from './stat-card';
import { useStats } from '../../hooks/useStas';
import { StatTitle } from './stat-titles';
import { Cube01, Transaction, Clock, Wallet02 } from '@/assets/icons';
import { Coffee } from 'lucide-react';

export const Stats = () => {
  const stats = useStats();
  const statCards = [
    { title: StatTitle.TotalBlocks, value: stats?.total_blocks, icon: Cube01 },
    { title: StatTitle.TotalTransactions, value: stats?.total_transactions, icon: Transaction },
    { title: StatTitle.AverageBlockTime, value: stats?.average_block_time, subValue: '(s)', icon: Clock },
    { title: StatTitle.TotalWallet, value: stats?.total_wallets, icon: Wallet02 },
    { title: StatTitle.TotalGiveCoffee, value: stats?.total_give_coffee, icon: Coffee },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {statCards.map((item) => (
        <StatCard
          key={item.title}
          icon={item.icon}
          title={item.title}
          value={item.value}
          subValue={item.subValue}
        />
      ))}
    </div>
  );
};
