'use client';

import { StatCard } from './stat-card';
import { useStats } from '../../hooks/useStas';
import { StatTitle } from './stat-titles';

const FA_ICONS: Record<StatTitle, string> = {
  [StatTitle.TotalBlocks]: 'fa-solid fa-cube',
  [StatTitle.TotalTransactions]: 'fa-solid fa-right-left',
  [StatTitle.AverageBlockTime]: 'fa-solid fa-clock',
  [StatTitle.TotalWallet]: 'fa-solid fa-wallet',
  [StatTitle.TotalGiveCoffee]: 'fa-solid fa-mug-saucer',
};

export const Stats = () => {
  const stats = useStats();
  const statCards = [
    { title: StatTitle.TotalBlocks, value: stats?.total_blocks },
    { title: StatTitle.TotalTransactions, value: stats?.total_transactions },
    { title: StatTitle.AverageBlockTime, value: stats?.average_block_time, subValue: '(s)' },
    { title: StatTitle.TotalWallet, value: stats?.total_wallets },
    { title: StatTitle.TotalGiveCoffee, value: stats?.total_give_coffee },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {statCards.map((item) => (
        <StatCard
          key={item.title}
          faIconClass={FA_ICONS[item.title as StatTitle]}
          title={item.title}
          value={item.value}
          subValue={item.subValue}
        />
      ))}
    </div>
  );
};
