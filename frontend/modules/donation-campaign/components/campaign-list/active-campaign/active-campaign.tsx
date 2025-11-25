'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useDebounce } from '@/hooks';
// next/navigation router not needed for toggle-only changes (we avoid router.replace)
import { CampaignCard } from './campaign-card';
import { ContactCard } from './contact-card';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { ROUTES } from '@/configs/routes.config';
import { useCampaigns } from '../../../hooks/useCampaigns';
import { useDualPaginationQueryParam } from '@/hooks/useDualPaginationQueryParam';
import { ECampaignStatus, DonationCampaign } from '../../../type';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUser } from '@/providers';
import { STORAGE_KEYS } from '@/constant';
import { ESortOrder } from '@/enums';

export enum SortBy {
  Newest = 'newest',
  EndingSoon = 'ending-soon',
  MostFunded = 'most-funded',
}

export const ActiveCampaign = () => {
  const [search, setSearch] = useState('');
  const { user } = useUser();
  const [sortBy, setSortBy] = useState<SortBy>(SortBy.Newest);
  const [showMine, setShowMine] = useState(false);
  // Removed unused verifiedSearch and unverifiedSearch states
  const [statusFilter, setStatusFilter] = useState<ECampaignStatus | 'all'>('all');
  const [verifiedFilter, setVerifiedFilter] = useState<'all' | 'verified' | 'unverified'>('all'); // shared for both lists

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mine = sessionStorage.getItem(STORAGE_KEYS.SHOW_MINE_CAMPAIGNS);
      setShowMine(mine === 'true');
      sessionStorage.removeItem(STORAGE_KEYS.SHOW_MINE_CAMPAIGNS);
    }
  }, []);

  // Dual pagination using query params
  const debouncedSearch = useDebounce(search, 400);

  const {
    verifiedPage,
    verifiedLimit,
    unverifiedPage,
    unverifiedLimit,
    handleChangeVerifiedPage,
    handleChangeVerifiedLimit,
    handleChangeUnverifiedPage,
    handleChangeUnverifiedLimit,
  } = useDualPaginationQueryParam();

  // Keep user id as string to avoid precision loss for very large numeric ids
  const userIdStr = user ? String(user.id) : undefined;
  // no router.replace on toggle — keep navigation-free updates

  // Local page/limit state used when 'My campaigns' is active so we can
  // reset pagination and navigate pages without touching the URL (no router.replace).
  const [verifiedLocalPage, setVerifiedLocalPage] = useState<number | undefined>(undefined);
  const [verifiedLocalLimit, setVerifiedLocalLimit] = useState<number | undefined>(undefined);
  const [unverifiedLocalPage, setUnverifiedLocalPage] = useState<number | undefined>(undefined);
  const [unverifiedLocalLimit, setUnverifiedLocalLimit] = useState<number | undefined>(undefined);

  const {
    campaigns: verifiedCampaigns,
    isLoading: isLoadingVerified,
    error: errorVerified,
    meta: verifiedMeta,
  } = useCampaigns({
    // when showMine is enabled, use the local page/limit state instead of URL-driven values
    page: showMine && typeof verifiedLocalPage === 'number' ? verifiedLocalPage : verifiedPage,
    limit: showMine && typeof verifiedLocalLimit === 'number' ? verifiedLocalLimit : verifiedLimit,
    ...(statusFilter !== 'all' ? { status: String(statusFilter) } : {}),
    ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
    ...(showMine && userIdStr ? { creator: userIdStr } : {}),
    order: sortBy === SortBy.Newest ? ESortOrder.DESC : ESortOrder.ASC,
    verified: true,
  });

  const {
    campaigns: unverifiedCampaigns,
    isLoading: isLoadingUnverified,
    error: errorUnverified,
    meta: unverifiedMeta,
  } = useCampaigns({
    // when showMine is enabled, use the local page/limit state instead of URL-driven values
    page: showMine && typeof unverifiedLocalPage === 'number' ? unverifiedLocalPage : unverifiedPage,
    limit: showMine && typeof unverifiedLocalLimit === 'number' ? unverifiedLocalLimit : unverifiedLimit,
    ...(statusFilter !== 'all' ? { status: String(statusFilter) } : {}),
    ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
    ...(showMine && userIdStr ? { creator: userIdStr } : {}),
    order: sortBy === SortBy.Newest ? ESortOrder.DESC : ESortOrder.ASC,
    verified: false,
  });

  const filteredVerifiedCampaigns =
    showMine && userIdStr !== undefined ? verifiedCampaigns.filter((c) => c.creator === userIdStr) : verifiedCampaigns;

  const filteredUnverifiedCampaigns =
    showMine && userIdStr !== undefined
      ? unverifiedCampaigns.filter((c) => c.creator === userIdStr)
      : unverifiedCampaigns;

  let pagedVerified: DonationCampaign[] = [];
  let pagedUnverified: DonationCampaign[] = [];

  if (verifiedFilter === 'all' || verifiedFilter === 'verified') {
    pagedVerified = filteredVerifiedCampaigns;
  }
  if (verifiedFilter === 'all' || verifiedFilter === 'unverified') {
    pagedUnverified = filteredUnverifiedCampaigns;
  }
  useEffect(() => {
    if (errorVerified) {
      toast.error('Failed to load verified campaigns. Please try again later.');
    }
    if (errorUnverified) {
      toast.error('Failed to load unverified campaigns. Please try again later.');
    }
  }, [errorVerified, errorUnverified]);

  const noVerifiedMessage = 'No verified campaigns found.';
  const noUnverifiedMessage = 'No unverified campaigns found.';

  useEffect(() => {
    if (!showMine) {
      setVerifiedLocalPage(verifiedPage);
      setVerifiedLocalLimit(verifiedLimit);
      setUnverifiedLocalPage(unverifiedPage);
      setUnverifiedLocalLimit(unverifiedLimit);
    }
  }, [showMine, verifiedPage, verifiedLimit, unverifiedPage, unverifiedLimit]);

  return (
    <>
      {isLoadingVerified || isLoadingUnverified ? (
        <section>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="border-brand-primary/30 border-t-brand-primary mx-auto h-12 w-12 animate-spin rounded-full border-4"></div>
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Loading campaigns...</p>
            </div>
          </div>
        </section>
      ) : (
        <section>
          <div className="dark:bg-brand-primary/10 w-full rounded-2xl border border-gray-200 bg-white/90 p-6 shadow-sm dark:border-white/10">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3 lg:grid-cols-5">
              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-200">Search</label>
                <div className="relative mt-1">
                  <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">🔍</span>
                  <input
                    id="search-input"
                    type="text"
                    placeholder="Search name or description..."
                    className="focus:border-primary focus:ring-primary dark:bg-brand-primary/10 w-full rounded-xl border border-gray-300 bg-white py-2 pr-3 pl-9 text-sm text-gray-700 placeholder-gray-400 dark:border-white/20 dark:text-white dark:placeholder-gray-500"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-200">Status</label>
                <Select
                  value={String(statusFilter)}
                  onValueChange={(val) => setStatusFilter(val === 'all' ? 'all' : (Number(val) as ECampaignStatus))}
                >
                  <SelectTrigger className="focus:border-primary focus:ring-primary dark:bg-brand-primary/10 mt-1 h-10 w-full rounded-xl border border-gray-300 bg-white py-2 pr-3 pl-9 text-sm text-gray-700 dark:border-white/20 dark:text-white">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-brand-primary/10 mt-1 overflow-hidden rounded-xl border border-gray-200 bg-white/90 text-gray-700 dark:text-white">
                    <SelectItem value="all" className="text-gray-700 dark:text-white">
                      All statuses
                    </SelectItem>
                    <SelectItem value={String(ECampaignStatus.Active)} className="text-gray-700 dark:text-white">
                      Active
                    </SelectItem>
                    <SelectItem value={String(ECampaignStatus.Draft)} className="text-gray-700 dark:text-white">
                      Draft
                    </SelectItem>
                    <SelectItem value={String(ECampaignStatus.Closed)} className="text-gray-700 dark:text-white">
                      Closed
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-200">Sort</label>
                <Select value={sortBy} onValueChange={(val) => setSortBy(val as SortBy)}>
                  <SelectTrigger className="focus:border-primary focus:ring-primary dark:bg-brand-primary/10 mt-1 h-10 w-full rounded-xl border border-gray-300 bg-white py-2 pr-3 pl-9 text-sm text-gray-700 dark:border-white/20 dark:text-white">
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-brand-primary/10 mt-1 overflow-hidden rounded-xl border border-gray-200 bg-white/90 text-gray-700 dark:text-white">
                    <SelectItem value={SortBy.Newest} className="text-gray-700 dark:text-white">
                      Newest
                    </SelectItem>
                    <SelectItem value={SortBy.EndingSoon} className="text-gray-700 dark:text-white">
                      Ending soon
                    </SelectItem>
                    <SelectItem value={SortBy.MostFunded} className="text-gray-700 dark:text-white">
                      Most funded
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-200">Verified</label>
                <Select
                  value={verifiedFilter}
                  onValueChange={(val) => setVerifiedFilter(val as 'all' | 'verified' | 'unverified')}
                >
                  <SelectTrigger className="focus:border-primary focus:ring-primary dark:bg-brand-primary/10 mt-1 h-10 w-full rounded-xl border border-gray-300 bg-white py-2 pr-3 pl-9 text-sm text-gray-700 dark:border-white/20 dark:text-white">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-brand-primary/10 mt-1 overflow-hidden rounded-xl border border-gray-200 bg-white/90 text-gray-700 dark:text-white">
                    <SelectItem value="all" className="text-gray-700 dark:text-white">
                      All
                    </SelectItem>
                    <SelectItem value="verified" className="text-gray-700 dark:text-white">
                      Verified only
                    </SelectItem>
                    <SelectItem value="unverified" className="text-gray-700 dark:text-white">
                      Unverified only
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-200">Mine</label>
                <Button
                  id="my-campaigns-toggle"
                  data-active={showMine}
                  variant={showMine ? 'default' : 'outline'}
                  className={`hover:border-primary hover:text-primary dark:bg-brand-primary/10 mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-600 dark:border-white/20 dark:text-white dark:hover:text-white ${showMine ? 'bg-primary dark:bg-brand-primary text-white' : ''}`}
                  onClick={() => {
                    const enabling = !showMine;

                    if (typeof window !== 'undefined') {
                      sessionStorage.setItem(STORAGE_KEYS.SHOW_MINE_CAMPAIGNS, enabling ? 'true' : 'false');
                    }
                    setVerifiedLocalPage(1);
                    setUnverifiedLocalPage(1);
                    setVerifiedLocalLimit(verifiedLimit);
                    setUnverifiedLocalLimit(unverifiedLimit);
                    setShowMine(enabling);
                  }}
                >
                  👤 My campaigns
                </Button>
              </div>
            </div>
          </div>

          {/* Verified Campaigns List */}
          {verifiedFilter !== 'unverified' && (
            <div className="mt-10 pb-10">
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Verified Campaigns</h2>
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {pagedVerified.length > 0 ? (
                  pagedVerified.map((campaign) => (
                    <CampaignCard key={campaign.id} campaign={campaign} highlight={debouncedSearch.trim() || undefined} />
                  ))
                ) : (
                  <div className="col-span-full text-center text-gray-500">{noVerifiedMessage}</div>
                )}
              </div>
              <Pagination
                page={showMine ? (verifiedLocalPage ?? 1) : verifiedPage}
                limit={showMine ? (verifiedLocalLimit ?? verifiedLimit) : verifiedLimit}
                totalPages={verifiedMeta?.total_pages || 1}
                totalItems={verifiedMeta?.total_items || filteredVerifiedCampaigns.length}
                isLoading={isLoadingVerified}
                onChangePage={(p) => {
                  if (showMine) setVerifiedLocalPage(p);
                  else handleChangeVerifiedPage(p);
                }}
                onChangeLimit={(l) => {
                  if (showMine) setVerifiedLocalLimit(l);
                  else handleChangeVerifiedLimit(l);
                }}
                className="mt-6"
              />
            </div>
          )}

          {verifiedFilter !== 'verified' && (
            <div className="mt-10 pb-10">
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Unverified Campaigns</h2>
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {pagedUnverified.length > 0 ? (
                  pagedUnverified.map((campaign) => (
                    <CampaignCard key={campaign.id} campaign={campaign} highlight={debouncedSearch.trim() || undefined} />
                  ))
                ) : (
                  <div className="col-span-full text-center text-gray-500">{noUnverifiedMessage}</div>
                )}
              </div>
              <Pagination
                page={showMine ? (unverifiedLocalPage ?? 1) : unverifiedPage}
                limit={showMine ? (unverifiedLocalLimit ?? unverifiedLimit) : unverifiedLimit}
                totalPages={unverifiedMeta?.total_pages || 1}
                totalItems={unverifiedMeta?.total_items || filteredUnverifiedCampaigns.length}
                isLoading={isLoadingUnverified}
                onChangePage={(p) => {
                  if (showMine) setUnverifiedLocalPage(p);
                  else handleChangeUnverifiedPage(p);
                }}
                onChangeLimit={(l) => {
                  if (showMine) setUnverifiedLocalLimit(l);
                  else handleChangeUnverifiedLimit(l);
                }}
                className="mt-6"
              />
            </div>
          )}

          <article className="group border-primary/40 bg-primary/5 hover:border-primary/60 hover:bg-primary/10 dark:border-brand-primary/40 dark:bg-brand-primary/10 dark:text-primary-light flex h-full flex-col rounded-3xl border border-dashed p-6 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
            <div className="bg-brand-primary/20 mx-auto flex h-14 w-14 items-center justify-center rounded-2xl">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 5v14m7-7H5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
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
                className="bg-brand-primary dark:bg-brand-primary/50 dark:hover:bg-brand-primary mt-6 inline-flex w-1/4 items-center justify-center rounded-2xl px-6 py-3 text-base font-semibold text-white transition hover:scale-[1.02] hover:shadow-lg"
                aria-label="Launch a new campaign - Get started"
              >
                Get started
              </Button>
            </Link>
          </article>

          <ContactCard />
        </section>
      )}
    </>
  );
};
