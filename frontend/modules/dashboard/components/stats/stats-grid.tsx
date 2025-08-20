import { CreditCardRefresh, Cube01, Hourglass01, Wallet02 } from '@/assets/icons';
import { StatCard } from './stat-card';

export const StatsGrid = () => {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard title="Total Blocks" value="8,746" icon={Cube01} />
      <StatCard title="Total Transactions" value="12,440" icon={CreditCardRefresh} />
      <StatCard title="Average Block Time" value="96" icon={Hourglass01} />
      <StatCard title="Total Wallet" value="96" icon={Wallet02} />
    </div>
  );
};
