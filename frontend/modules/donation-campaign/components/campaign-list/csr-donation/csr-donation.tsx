import { CreditCardRefresh, Cube01, Hourglass01 } from '@/assets/icons';
import Link from 'next/link';
import { StatCard } from '@/components/shared';
import { ROUTES } from '@/configs/routes.config';
import { Button } from '@/components/ui/button';

export const CSRDonation = () => {
  const statCards = [
    {
      icon: Cube01,
      title: 'Campaigns live',
      value: 62000,
    },
    {
      icon: CreditCardRefresh,
      title: 'Total raised (MMN)',
      value: 1000,
    },
    {
      icon: Hourglass01,
      title: 'Contributors',
      value: 8,
      subValue: '(s)',
    },
  ];

  return (
    <section className="">
      <div className="max-w-4xl">
        <p className="text-primary text-xs font-semibold tracking-[0.3em] uppercase">CSR Donation</p>
        <h1 className="mt-4 text-3xl font-semibold text-gray-900 sm:text-4xl dark:text-white">
          Mezon Donation Campaigns
        </h1>
        <p className="mt-4 text-sm leading-6 text-gray-600 dark:text-gray-300">
          Discover active CSR initiatives, monitor fundraising progress in real time, and help the Mezon team deliver
          meaningful impact to local communities.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button
            variant="link"
            size="lg"
            className="bg-brand-primary shadow-primary/30 hover:bg-brand-primary/90 focus-visible:outline-primary dark:hover:bg-brand-primary/90 inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-lg transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <Link href={ROUTES.CREATE_CAMPAIGN}>+ Create campaign</Link>
          </Button>
          <Link
            href="#"
            className="hover:border-primary hover:text-primary dark:hover:border-primary-light inline-flex items-center justify-center rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition dark:border-white/20 dark:text-gray-200 dark:hover:text-white"
          >
            Contribution guide
          </Link>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {statCards.map((item) => (
            <StatCard
              key={item.title}
              icon={item.icon}
              title={item.title}
              value={item.value}
              subValue={item.subValue}
              className="uppercase"
            />
          ))}
        </div>
      </div>
    </section>
  );
};
