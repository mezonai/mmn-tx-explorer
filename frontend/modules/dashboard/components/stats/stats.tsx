'use client';

import { StatCard } from './stat-card';
import { StatTitle } from './stat-titles';
import { Cube01, Transaction, Clock, Wallet02 } from '@/assets/icons';

interface StatsProps {
  blockStats?: number;
  totalTxStats?: number;
  avgBlockTimeStats?: number;
  totalWalletsStats?: number;
}

export const Stats = ({ blockStats = 0, totalTxStats = 0, avgBlockTimeStats = 0, totalWalletsStats = 0 }: StatsProps) => {
  const statCards = [
    { title: StatTitle.TotalBlocks, value: blockStats, icon: Cube01 },
    { title: StatTitle.TotalTransactions, value: totalTxStats, icon: Transaction },
    { title: StatTitle.AverageBlockTime, value: avgBlockTimeStats, subValue: '(s)', icon: Clock },
    { title: StatTitle.TotalWallet, value: totalWalletsStats, icon: Wallet02 },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {statCards.map((item) => (
        <StatCard key={item.title} icon={item.icon} title={item.title} value={item.value} subValue={item.subValue} />
      ))}
    </div>
  );
};
