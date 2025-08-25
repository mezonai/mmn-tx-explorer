import { IDashboardStats } from '@/modules/dashboard';
import { NumberUtil } from '@/utils';
import { StatCard } from './stat-card';

interface StatGridProps {
  stats: IDashboardStats;
}

export const StatsGrid = ({ stats }: StatGridProps) => {
  return (
    <>
      <StatCard title="Transactions" value={NumberUtil.formatWithCommas(stats.total_transactions)} />
      <StatCard title="Pending transactions" value={NumberUtil.formatWithCommas(stats.total_pending_transactions)} />
    </>
  );
};
