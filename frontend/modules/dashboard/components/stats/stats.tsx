'use client';

import { StatCard } from './stat-card';
import { useStats } from '../../hooks/useStas';

const FA_ICONS: Record<string, string> = {
  'Total Blocks': 'fa-solid fa-cube',
  'Total Transactions': 'fa-solid fa-right-left',
  'Average Block Time': 'fa-solid fa-clock',
  'Total Wallet': 'fa-solid fa-wallet',
  'Total Give Coffee': 'fa-solid fa-mug-saucer',
};

export const Stats = () => {
  const stats = useStats();
  const statCards = [
    { title: 'Total Blocks', value: stats?.total_blocks },
    { title: 'Total Transactions', value: stats?.total_transactions },
    { title: 'Average Block Time', value: stats?.average_block_time, subValue: '(s)' },
    { title: 'Total Wallet', value: stats?.total_wallets },
    { title: 'Total Give Coffee', value: stats?.total_give_coffee },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {statCards.map((item) => (
        <StatCard
          key={item.title}
          faIconClass={FA_ICONS[item.title]}
          title={item.title}
          value={item.value}
          subValue={item.subValue}
        />
      ))}
    </div>
  );
};
