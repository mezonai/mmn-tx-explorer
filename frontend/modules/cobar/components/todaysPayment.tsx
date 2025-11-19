import { StatCard } from './shared';
import { APP_CONFIG } from '@/configs/app.config';
import { useCobarStats } from '../hooks';
import { NumberUtil } from '@/utils';

export const TodaysPayment = () => {
  const { cobarStats, isLoading } = useCobarStats();

  const statCards = [
    { title: 'Total Users', value: cobarStats?.total_users || 0 },
    { title: 'Total Orders', value: cobarStats?.total_orders || 0 },
    {
      title: 'Total Amount',
      value: cobarStats?.total_amount ? NumberUtil.formatWithCommas(cobarStats.total_amount) : 0,
      subValue: APP_CONFIG.CHAIN_SYMBOL,
    },
  ];
  return (
    <div className="mt-10 w-full">
      <h2 className="text-xl font-bold">Today's Payments</h2>
      <div className="mt-4 grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
        {statCards.map((card) => (
          <StatCard key={card.title} title={card.title} value={card.value} subValue={card.subValue} isLoading={isLoading} />
        ))}
      </div>
    </div>
  );
};
