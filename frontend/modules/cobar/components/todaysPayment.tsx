import { StatCard } from './shared';
import { APP_CONFIG } from '@/configs/app.config';

export const TodaysPayment = () => {
  return (
    <div className="mt-10 w-full">
      <h2 className="text-xl font-bold">Today's Payments</h2>
      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard title="Orders" value="248" percentage={18} time="24h" />
        <StatCard title="Total" value="32,480" percentage={8.2} />
        <StatCard title="Average Ticket" value="131" percentage={4.5} currency={APP_CONFIG.CHAIN_SYMBOL} />
      </div>
    </div>
  );
};
