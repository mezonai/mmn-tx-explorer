import { LatestBlocks } from './latest-blocks';
import { LatestTransactions } from './latest-transactions';
import { Stats } from './stats';

export const Dashboard = () => {
  return (
    <div className="space-y-8">
      <div className="space-y-5">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
      </div>

      <Stats />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-9">
        <LatestBlocks />
        <LatestTransactions />
      </div>
    </div>
  );
};
