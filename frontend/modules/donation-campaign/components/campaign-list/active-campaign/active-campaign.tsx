import Link from 'next/link';
import { useState, useMemo } from 'react';
import { CampaignCard } from './campaign-card';
import { ContactCard } from './contact-card';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/configs/routes.config';
import { useCampaigns } from '../../../hooks/useCampaigns';
import { CampaignStatus } from '../../../type';
import { toast } from 'sonner';
import { ArrowDown } from 'lucide-react';
import { sortCampaigns } from '@/modules/donation-campaign/utils';

export const ActiveCampaign = () => {
  const { campaigns, isLoading, error } = useCampaigns();
  const [selectedStatus, setSelectedStatus] = useState<CampaignStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const filteredCampaigns = useMemo(() => {
    const byStatus = selectedStatus === 'all' ? campaigns : campaigns.filter((c) => c.status === selectedStatus);
    return sortCampaigns(byStatus, sortBy);
  }, [campaigns, selectedStatus, sortBy]);

  const statusOptions = [
    { value: 'all', label: 'All statuses' },
    { value: CampaignStatus.Active, label: 'Active' },
    { value: CampaignStatus.Draft, label: 'Draft' },
    { value: CampaignStatus.Closed, label: 'Closed' },
  ];

  const selectedLabel = statusOptions.find((option) => option.value === selectedStatus)?.label || 'All statuses';

  if (isLoading) {
    return (
      <section className="">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="border-primary/30 border-t-primary mx-auto h-12 w-12 animate-spin rounded-full border-4"></div>
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Loading campaigns...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    toast.error('Failed to load campaigns. Please try again later.');
  }

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
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="hover:border-primary hover:text-primary dark:hover:border-primary-light inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 font-medium text-gray-600 transition dark:border-white/10 dark:text-gray-300 dark:hover:text-white"
              >
                {selectedLabel}
                <svg
                  className={`h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              {isDropdownOpen && (
                <div className="absolute top-full right-0 z-10 mt-2 w-48 rounded-xl border border-gray-200 bg-white py-2 shadow-lg dark:border-white/10 dark:bg-gray-800">
                  {statusOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSelectedStatus(option.value as CampaignStatus | 'all');
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm transition hover:bg-gray-50 dark:hover:bg-gray-700 ${
                        selectedStatus === option.value
                          ? 'text-primary bg-primary/5 dark:text-primary-light dark:bg-primary/10'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => setSortBy((prev) => (prev === 'newest' ? 'oldest' : 'newest'))}
              className="hover:border-primary hover:text-primary dark:hover:border-primary-light inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 font-medium text-gray-600 transition dark:border-white/10 dark:text-gray-300 dark:hover:text-white"
              aria-label={`Toggle sort order (currently ${sortBy})`}
            >
              Sort by {sortBy === 'newest' ? 'newest' : 'oldest'}
              <ArrowDown className={`h-4 w-4 transition-transform ${sortBy === 'oldest' ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {filteredCampaigns.length > 0 ? (
            filteredCampaigns.map((campaign) => <CampaignCard key={campaign.id} campaign={campaign} />)
          ) : (
            <div></div>
          )}
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

            <Link href={ROUTES.CREATE_CAMPAIGN}>
              <Button
                variant="link"
                className="bg-brand-primary dark:hover:bg-brand-primary dark:bg-brand-primary/50 mt-6 inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold text-white transition"
              >
                Get started
              </Button>
            </Link>
          </article>
        </div>

        <ContactCard />
      </div>
    </section>
  );
};
