import Link from 'next/link';
import { CampaignCard } from './campaign-card';
import { CampaignStatus, DonationCampaign } from '../../../type';
import { ContactCard } from './contact-card';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/configs/routes.config';

const campaignMockData: DonationCampaign[] = [
  {
    id: '1',
    title: 'Xây Trường Cho Em',
    status: CampaignStatus.Active,
    endDate: '2023-12-31',
    description:
      'Raise funds to build three resilient classrooms and a community library for children in Điện Biên province.',
    currentAmount: 10000,
    targetAmount: 50000,
    contributors: 48,
    lastDonation: '2025-10-22T08:26:38.349Z',
  },
  {
    id: '2',
    title: 'Warm Clothes for Highland Kids',
    status: CampaignStatus.Active,
    endDate: '2023-12-31',
    description:
      'Provide insulated jackets, gloves, and heaters for 800 students living in remote northern mountains ahead of winter.',
    currentAmount: 10000,
    targetAmount: 50000,
    contributors: 48,
    lastDonation: '2025-10-22T08:26:38.349Z',
  },
  {
    id: '3',
    title: 'Digital Classroom Launchpad',
    status: CampaignStatus.Draft,
    endDate: '2023-12-31',
    description: 'Build a mini computer lab with 20 devices and STEM mentoring sessions for secondary school students.',
    currentAmount: 10000,
    targetAmount: 50000,
    contributors: 48,
    lastDonation: '2025-10-22T08:26:38.349Z',
  },
  {
    id: '4',
    title: 'Water Access for Border Guards',
    status: CampaignStatus.Active,
    endDate: '2023-12-31',
    description:
      'Install a 10,000-liter filtration and storage system for a border guard station and the households nearby.',
    currentAmount: 10000,
    targetAmount: 50000,
    contributors: 48,
    lastDonation: '2025-10-22T08:26:38.349Z',
  },
  {
    id: '5',
    title: 'Library for Coastal Kids',
    status: CampaignStatus.Closed,
    endDate: '2023-12-31',
    description:
      'Deliver a floating library and life-skills workshops for island communities with over 5,000 curated books.',
    currentAmount: 10000,
    targetAmount: 50000,
    contributors: 48,
    lastDonation: '2025-10-22T08:26:38.349Z',
  },
];

export const ActiveCampaign = () => {
  return (
    <section className="">
      <div className="">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Active campaigns</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Real-time snapshots from the MMN chain. Select a campaign to view detail and donate.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <button className="hover:border-primary hover:text-primary dark:hover:border-primary-light inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 font-medium text-gray-600 transition dark:border-white/10 dark:text-gray-300 dark:hover:text-white">
              All statuses
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <button className="hover:border-primary hover:text-primary dark:hover:border-primary-light inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 font-medium text-gray-600 transition dark:border-white/10 dark:text-gray-300 dark:hover:text-white">
              Sort by newest
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M10 3.75a.75.75 0 0 1 .75.75v8.99l2.22-2.22a.75.75 0 0 1 1.06 1.06l-3.5 3.5a.75.75 0 0 1-1.06 0l-3.5-3.5a.75.75 0 0 1 1.06-1.06l2.22 2.22V4.5A.75.75 0 0 1 10 3.75z" />
              </svg>
            </button>
          </div>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {campaignMockData.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}

          {/* Create New Campaign Card */}
          <article className="group border-primary/40 bg-primary/5 text-primary hover:border-primary/60 hover:bg-primary/10 dark:border-primary/40 dark:bg-primary/10 dark:text-primary-light flex flex-col rounded-3xl border border-dashed p-6 text-center text-sm shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
            <div className="bg-primary/20 text-primary dark:bg-primary/30 dark:text-primary-light mx-auto flex h-14 w-14 items-center justify-center rounded-2xl">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M12 5v14m7-7H5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                ></path>
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-semibold">Launch a new campaign</h3>
            <p className="text-primary/80 dark:text-primary-light/80 mt-2 text-sm leading-6">
              Prepare your storyline, media assets, and fundraising targets so you can publish as soon as stakeholders
              approve.
            </p>

            <Button
              variant="link"
              className="bg-primary hover:bg-primary-light mt-6 inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold text-white transition"
            >
              <Link href={ROUTES.CREATE_CAMPAIGN}>Get started</Link>
            </Button>
          </article>
        </div>

        <ContactCard />
      </div>
    </section>
  );
};
