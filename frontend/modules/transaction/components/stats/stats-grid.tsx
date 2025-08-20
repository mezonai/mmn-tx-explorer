import { StatCard } from './stat-card';

export const StatsGrid = () => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <StatCard title="Transactions" value="8,746" subValue="(24h)" />
      <StatCard title="Pending transactions" value="415" subValue="(30min)" />
      <StatCard title="Avg. transaction fee" value="$1.47" subValue="(24h)" />
    </div>
  );
};
