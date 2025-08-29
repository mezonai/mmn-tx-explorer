import { LatestBlocks } from './latest-blocks';
import { LatestTransactions } from './latest-transactions';
import { Stats } from './stats';

export const Dashboard = () => {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <Stats />

      <div className="flex flex-col gap-x-9 gap-y-6 xl:flex-row">
        <LatestBlocks className="w-full xl:w-[328px]" />
        <LatestTransactions className="w-full xl:flex-1" />
      </div>
    </div>
  );
};
