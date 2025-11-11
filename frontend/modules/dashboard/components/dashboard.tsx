import { LatestBlocks } from './latest-blocks';
import { LatestTransactions } from './latest-transactions';
import { Stats } from './stats';
import { EcosystemHighlights } from './ecosystem-highlights';

export const Dashboard = () => {
  return (
    <div className="space-y-8">
      <Stats />
      <EcosystemHighlights />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
