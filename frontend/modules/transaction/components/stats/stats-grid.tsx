import { StatCard } from './stat-card';

export const StatsGrid = () => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <StatCard title="Transactions" value="8,746" subValue="(24h)" />
      <StatCard title="Pending transactions" value="415" subValue="(30min)" />
    </div>
  );
};
