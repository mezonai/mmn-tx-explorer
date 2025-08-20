import { CreditCardRefresh, Cube01, Hourglass01, Wallet02 } from '@/assets/icons';
import { StatCard } from './stat-card';
import { StatCardSkeleton } from './stat-card-skeleton';

interface StatsGridProps {
  totalBlocks?: number;
  totalTransactions?: number;
  averageBlockTime?: number;
  totalWallet?: number;
}

export const StatsGrid = ({ totalBlocks, totalTransactions, averageBlockTime, totalWallet }: StatsGridProps) => {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {totalBlocks === undefined ? (
        <StatCardSkeleton icon={Cube01} title="Total Blocks" />
      ) : (
        <StatCard icon={Cube01} title="Total Blocks" value={totalBlocks} />
      )}

      {totalTransactions === undefined ? (
        <StatCardSkeleton icon={CreditCardRefresh} title="Total Transactions" />
      ) : (
        <StatCard icon={CreditCardRefresh} title="Total Transactions" value={totalTransactions} />
      )}

      {averageBlockTime === undefined ? (
        <StatCardSkeleton icon={Hourglass01} title="Average Block Time" />
      ) : (
        <StatCard icon={Hourglass01} title="Average Block Time" value={averageBlockTime} />
      )}

      {totalWallet === undefined ? (
        <StatCardSkeleton icon={Wallet02} title="Total Wallet" />
      ) : (
        <StatCard icon={Wallet02} title="Total Wallet" value={totalWallet} />
      )}
    </div>
  );
};
