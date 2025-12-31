'use client';
import { LatestBlocks } from './latest-blocks';
import { LatestTransactions } from './latest-transactions';
import { Stats } from './stats';
import { EcosystemHighlights } from './ecosystem-highlights';
import { useStats } from '../hooks/useStas';

export const Dashboard = () => {
  const stats = useStats();

  return (
    <div className="space-y-8">
      <Stats
        blockStats={stats?.total_blocks}
        totalTxStats={stats?.total_transactions}
        avgBlockTimeStats={stats?.average_block_time}
        totalWalletsStats={stats?.total_wallets}
      />
      <EcosystemHighlights giveCoffeeStats={stats?.total_give_coffee} />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <LatestBlocks />
        </div>
        <div className="lg:col-span-2">
          <LatestTransactions />
        </div>
      </div>
    </div>
  );
};
