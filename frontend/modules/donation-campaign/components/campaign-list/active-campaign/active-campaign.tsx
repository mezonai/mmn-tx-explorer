import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CampaignCard } from './campaign-card';
import { ContactCard } from './contact-card';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { ROUTES } from '@/configs/routes.config';
import { useCampaigns } from '../../../hooks/useCampaigns';
import { ECampaignStatus } from '../../../type';
import { toast } from 'sonner';
import { ArrowDown } from 'lucide-react';
import { usePaginationQueryParam } from '@/hooks';
import { getCampaignStatusLabel } from '@/modules/donation-campaign/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const ActiveCampaign = () => {
  const [selectedStatus, setSelectedStatus] = useState<ECampaignStatus | 'all'>(ECampaignStatus.Active);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const { page, limit, handleChangePage, handleChangeLimit } = usePaginationQueryParam();

  const { campaigns, meta, isLoading, error } = useCampaigns({
    page,
    limit,
    ...(selectedStatus !== 'all' ? { status: String(selectedStatus) } : {}),
    order: sortBy === 'newest' ? 'desc' : 'asc',
  });
  useEffect(() => {
    if (error) {
      toast.error('Failed to load campaigns. Please try again later.');
    }
  }, [error]);

  const statusOptions = [
    { value: 'all', label: 'All statuses' },
    { value: ECampaignStatus.Active, label: getCampaignStatusLabel(ECampaignStatus.Active) },
    { value: ECampaignStatus.Draft, label: getCampaignStatusLabel(ECampaignStatus.Draft) },
    { value: ECampaignStatus.Closed, label: getCampaignStatusLabel(ECampaignStatus.Closed) },
  ];
  const selectedLabel = selectedStatus === 'all' ? 'All statuses' : getCampaignStatusLabel(selectedStatus);

  if (isLoading) {
    return (
      <section className="">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="border-brand-primary/30 border-t-brand-primary mx-auto h-12 w-12 animate-spin rounded-full border-4"></div>
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Loading campaigns...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="">
      <div className="">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Active campaigns</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Select a campaign to view detail and donate.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <div className="relative">
              <Select
                size="sm"
                value={String(selectedStatus)}
                onValueChange={(val) => {
                  const next = val === 'all' ? 'all' : (Number(val) as ECampaignStatus);
                  setSelectedStatus(next);
                }}
              >
                <SelectTrigger className="hover:border-brand-primary hover:text-brand-primary dark:bg-background dark:hover:border-brand-primary-light inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 font-medium text-gray-600 transition hover:bg-white dark:border-white/10 dark:text-gray-300 dark:hover:text-white">
                  <SelectValue placeholder="All statuses">{selectedLabel}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={String(option.value)} value={String(option.value)}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => setSortBy((prev) => (prev === 'newest' ? 'oldest' : 'newest'))}
              className="bg-background hover:bg-background hover:border-brand-primary hover:text-brand-primary dark:hover:border-brand-primary-light inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 font-medium text-gray-600 transition dark:border-white/10 dark:text-gray-300 dark:hover:text-white"
              aria-label={`Toggle sort order (currently ${sortBy})`}
            >
              Sort by {sortBy === 'newest' ? 'newest' : 'oldest'}
              <ArrowDown className={`h-4 w-4 transition-transform ${sortBy === 'oldest' ? 'rotate-180' : ''}`} />
            </Button>
          </div>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {campaigns.length > 0 ? (
            campaigns.map((campaign) => <CampaignCard key={campaign.id} campaign={campaign} />)
          ) : (
            <div></div>
          )}
          <article className="group border-primary/40 bg-primary/5 text-primary hover:border-primary/60 hover:bg-primary/10 dark:border-brand-primary/40 dark:bg-brand-primary/10 dark:text-primary-light flex h-full flex-col rounded-3xl border border-dashed p-6 text-center text-sm shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
            <div className="bg-brand-primary/20 dark:text-primary-light mx-auto flex h-14 w-14 items-center justify-center rounded-2xl">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M12 5v14m7-7H5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-brand-primary"
                ></path>
              </svg>
            </div>
            <h3 className="text-brand-primary mt-4 text-lg font-semibold">Launch a new campaign</h3>
            <p className="text-brand-primary mt-2 text-sm leading-6">
              Prepare your storyline, media assets, and fundraising targets so you can publish as soon as stakeholders
              approve.
            </p>

            <Link href={ROUTES.CREATE_CAMPAIGN} className="mt-auto">
              <Button
                variant="link"
                className="bg-brand-primary dark:hover:bg-brand-primary dark:bg-brand-primary/50 mt-6 inline-flex w-full items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold text-white transition hover:no-underline"
              >
                Get started
              </Button>
            </Link>
          </article>
        </div>
        <Pagination
          page={page}
          limit={limit}
          totalPages={meta?.total_pages || 1}
          totalItems={meta?.total_items || 0}
          isLoading={isLoading}
          onChangePage={handleChangePage}
          onChangeLimit={handleChangeLimit}
          className="mt-6"
        />
        <ContactCard />
      </div>
    </section>
  );
};
