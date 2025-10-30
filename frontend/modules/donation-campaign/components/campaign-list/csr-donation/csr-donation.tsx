import Link from 'next/link';
import { StatCard } from '@/components/shared';
import { ROUTES } from '@/configs/routes.config';
import { Button } from '@/components/ui/button';
import { useCampaignStats } from '@/modules/donation-campaign/hooks';
import { NumberUtil } from '@/utils';
import { PageHeader } from '@/components/shared';
import { APP_CONFIG } from '@/configs/app.config';

export const CSRDonation = () => {
  const { stats } = useCampaignStats();

  const statCards = [
    {
      title: 'Campaigns live',
      value: stats.total_campaigns_active,
    },
    {
      title: 'Total raised',
      value: `${NumberUtil.formatWithCommasAndScale(stats.total_amount)}`,
      subValue: ` ${APP_CONFIG.CHAIN_SYMBOL}`,
    },
    {
      title: 'Contributors',
      value: NumberUtil.formatWithCommas(stats.total_contributors),
    },
  ];

  return (
    <section className="">
      <div className="max-w-4xl">
        <PageHeader
          title="CSR Donation"
          header="Mezon Donation Campaigns"
          description="Discover active CSR initiatives, monitor fundraising progress in real time, and help the Mezon team deliver
          meaningful impact to local communities."
        />
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button
            variant="link"
            size="lg"
            className="bg-brand-primary shadow-primary/30 hover:bg-brand-primary/80 focus-visible:outline-primary dark:hover:bg-brand-primary/90 border-1px border-primary inline-flex items-center justify-center rounded-lg px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 dark:shadow-none"
          >
            <Link href={ROUTES.CREATE_CAMPAIGN}>+ Create campaign</Link>
          </Button>
          <Link
            href="#"
            className="hover:border-primary hover:text-primary dark:hover:border-primary-light inline-flex items-center justify-center rounded-lg border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition dark:border-white/20 dark:text-gray-200 dark:hover:text-white"
          >
            Contribution guide
          </Link>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {statCards.map((item) => (
            <StatCard key={item.title} title={item.title} value={item.value} subValue={item.subValue} />
          ))}
        </div>
      </div>
    </section>
  );
};
