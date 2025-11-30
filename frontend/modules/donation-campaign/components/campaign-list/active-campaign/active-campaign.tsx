'use client';
import { useEffect, useState, useRef } from 'react';
import { useDebounce } from '@/hooks';
import { CampaignCard } from './campaign-card';
import { LaunchCampaignCTA } from './launch-cta';
import { ContactCard } from './contact-card';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';

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
  // Default to showing only active campaigns
  const [statusFilter, setStatusFilter] = useState<ECampaignStatus | 'all'>(ECampaignStatus.Active);
  const [verifiedFilter, setVerifiedFilter] = useState<'all' | 'verified' | 'unverified'>('all'); // shared for both lists

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mine = sessionStorage.getItem(STORAGE_KEYS.SHOW_MINE_CAMPAIGNS);
      setShowMine(mine === 'true');
      sessionStorage.removeItem(STORAGE_KEYS.SHOW_MINE_CAMPAIGNS);
    }
  }, []);

  const debouncedSearch = useDebounce(search, 400);
  const searchScrollRef = useRef<number | null>(null);
  const isSearchingRef = useRef(false);
  const prevDebouncedRef = useRef('');
  const isFilteringRef = useRef(false);
  const prevFiltersRef = useRef({ statusFilter, verifiedFilter, sortBy, showMine });
  const hasMountedRef = useRef(false);

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

  const verifiedSectionRef = useRef<HTMLDivElement | null>(null);
  const unverifiedSectionRef = useRef<HTMLDivElement | null>(null);

  const userIdStr = user ? String(user.id) : undefined;
  const [verifiedLocalPage, setVerifiedLocalPage] = useState<number | undefined>(undefined);
  const [verifiedLocalLimit, setVerifiedLocalLimit] = useState<number | undefined>(undefined);
  const [unverifiedLocalPage, setUnverifiedLocalPage] = useState<number | undefined>(undefined);
  const [unverifiedLocalLimit, setUnverifiedLocalLimit] = useState<number | undefined>(undefined);

  const buildCampaignsParams = (
    isVerified: boolean,
    localPage: number | undefined,
    localLimit: number | undefined,
    page: number,
    limit: number
  ) => {
    let order_by: 'end_date' | 'total_amount' | 'created_at' | 'recent_amount' | undefined;
    if (sortBy === SortBy.EndingSoon) order_by = 'end_date';
    else if (sortBy === SortBy.MostFunded) order_by = 'total_amount';
    else order_by = 'created_at';
    return {
      page: showMine && typeof localPage === 'number' ? localPage : page,
      limit: showMine && typeof localLimit === 'number' ? localLimit : limit,
      ...(statusFilter !== 'all' ? { status: String(statusFilter) } : {}),
      ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
      ...(showMine && userIdStr ? { creator: userIdStr } : {}),
      order: sortBy === SortBy.Newest || sortBy === SortBy.MostFunded ? ESortOrder.DESC : ESortOrder.ASC,
      order_by,
      verified: isVerified,
    };
  };

  const {
    campaigns: verifiedCampaigns,
    isLoading: isLoadingVerified,
    error: errorVerified,
    meta: verifiedMeta,
  } = useCampaigns(buildCampaignsParams(true, verifiedLocalPage, verifiedLocalLimit, verifiedPage, verifiedLimit));

  const {
    campaigns: unverifiedCampaigns,
    isLoading: isLoadingUnverified,
    error: errorUnverified,
    meta: unverifiedMeta,
  } = useCampaigns(
    buildCampaignsParams(false, unverifiedLocalPage, unverifiedLocalLimit, unverifiedPage, unverifiedLimit)
  );

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

  const noVerifiedMessage = debouncedSearch.trim()
    ? `No verified campaigns found for "${debouncedSearch.trim()}".`
    : 'No verified campaigns found.';
  const noUnverifiedMessage = debouncedSearch.trim()
    ? `No unverified campaigns found for "${debouncedSearch.trim()}".`
    : 'No unverified campaigns found.';

  useEffect(() => {
    if (!showMine) {
      setVerifiedLocalPage(verifiedPage);
      setVerifiedLocalLimit(verifiedLimit);
      setUnverifiedLocalPage(unverifiedPage);
      setUnverifiedLocalLimit(unverifiedLimit);
    }
  }, [showMine, verifiedPage, verifiedLimit, unverifiedPage, unverifiedLimit]);

  useEffect(() => {
    if (prevDebouncedRef.current !== debouncedSearch) {
      if (typeof window !== 'undefined') {
        searchScrollRef.current = window.scrollY;
      }
      isSearchingRef.current = true;
      prevDebouncedRef.current = debouncedSearch;
    }
  }, [debouncedSearch]);

  useEffect(() => {
    if (!hasMountedRef.current) return;

    const prev = prevFiltersRef.current;
    if (
      prev.statusFilter !== statusFilter ||
      prev.verifiedFilter !== verifiedFilter ||
      prev.sortBy !== sortBy ||
      prev.showMine !== showMine
    ) {
      isFilteringRef.current = true;
    }

    prevFiltersRef.current = { statusFilter, verifiedFilter, sortBy, showMine };
  }, [statusFilter, verifiedFilter, sortBy, showMine]);

  useEffect(() => {
    hasMountedRef.current = true;
  }, []);

  useEffect(() => {
    if (!isSearchingRef.current && !isFilteringRef.current) return;
    if (!isLoadingVerified && !isLoadingUnverified) {
      if (isSearchingRef.current && typeof window !== 'undefined' && searchScrollRef.current !== null) {
        window.scrollTo({ top: searchScrollRef.current, behavior: 'auto' });
      }

      isSearchingRef.current = false;
      isFilteringRef.current = false;
      searchScrollRef.current = null;
    }
  }, [isLoadingVerified, isLoadingUnverified]);

  return (
    <>
      {(isLoadingVerified || isLoadingUnverified) && debouncedSearch.trim() === '' && !isFilteringRef.current ? (
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
          <div className="dark:bg-card w-full rounded-2xl border border-gray-200 bg-white/90 p-6 shadow-sm dark:border-white/10">
            <div className="flex w-full flex-col flex-wrap justify-between gap-3 md:flex-row md:items-end md:gap-4">
              {/* Search */}
              <div className="min-w-[320px] flex-1 md:max-w-[480px]">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-200">Search</label>
                <div className="relative mt-1">
                  <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">🔍</span>
                  <input
                    id="search-input"
                    type="text"
                    placeholder="Search name or description..."
                    className="focus:border-primary focus:ring-primary dark:bg-card w-full rounded-xl border border-gray-300 bg-white py-2 pr-3 pl-9 text-sm text-gray-700 placeholder-gray-400 dark:border-white/20 dark:text-white dark:placeholder-gray-500"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
              {/* Status */}
              <div className="min-w-[120px] flex-none md:min-w-[200px]">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-200">Status</label>
                <Select
                  value={String(statusFilter)}
                  onValueChange={(val) => {
                    isFilteringRef.current = true;
                    setStatusFilter(val === 'all' ? 'all' : (Number(val) as ECampaignStatus));
                  }}
                >
                  <SelectTrigger className="focus:border-primary focus:ring-primary dark:bg-card mt-1 h-10 w-full rounded-xl border border-gray-300 bg-white py-2 pr-3 pl-9 text-sm text-gray-700 dark:border-white/20 dark:text-white">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-card mt-1 overflow-hidden rounded-xl border border-gray-200 bg-white/90 text-gray-700 dark:text-white">
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
              {/* Sort */}
              <div className="min-w-[120px] flex-none md:min-w-[200px]">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-200">Sort</label>
                <Select
                  value={sortBy}
                  onValueChange={(val) => {
                    isFilteringRef.current = true;
                    setSortBy(val as SortBy);
                  }}
                >
                  <SelectTrigger className="focus:border-primary focus:ring-primary dark:bg-card mt-1 h-10 w-full rounded-xl border border-gray-300 bg-white py-2 pr-3 pl-9 text-sm text-gray-700 dark:border-white/20 dark:text-white">
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-card mt-1 overflow-hidden rounded-xl border border-gray-200 bg-white/90 text-gray-700 dark:text-white">
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
              {/* Verified */}
              <div className="min-w-[120px] flex-none md:min-w-[200px]">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-200">Verified</label>
                <Select
                  value={verifiedFilter}
                  onValueChange={(val) => {
                    isFilteringRef.current = true;
                    setVerifiedFilter(val as 'all' | 'verified' | 'unverified');
                  }}
                >
                  <SelectTrigger className="focus:border-primary focus:ring-primary dark:bg-card mt-1 h-10 w-full rounded-xl border border-gray-300 bg-white py-2 pr-3 pl-9 text-sm text-gray-700 dark:border-white/20 dark:text-white">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-card mt-1 overflow-hidden rounded-xl border border-gray-200 bg-white/90 text-gray-700 dark:text-white">
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
              {/* My campaigns*/}
              <div className="min-w-[100px] items-end md:min-w-[200px] md:justify-end">
                <div className="w-auto">
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-200">Mine</label>
                  <div className="mt-1">
                    <Button
                      id="my-campaigns-toggle"
                      data-active={showMine}
                      variant={showMine ? 'default' : 'outline'}
                      className={`hover:border-primary hover:text-primary dark:bg-card h-10 w-full rounded-xl border border-gray-300 px-4 text-sm font-normal text-gray-600 dark:border-white/20 dark:text-gray-200 dark:hover:text-white ${showMine ? 'bg-primary dark:bg-brand-primary text-white' : ''}`}
                      onClick={() => {
                        const enabling = !showMine;
                        isFilteringRef.current = true;
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
            </div>
          </div>

          {verifiedFilter !== 'unverified' && (
            <div
              ref={(el) => {
                verifiedSectionRef.current = el;
              }}
              className="mt-10 pb-10"
            >
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                Verified Campaigns
                {isLoadingVerified &&
                  (debouncedSearch.trim() !== '' || isSearchingRef.current ? (
                    <span className="ml-3 inline-flex items-center text-sm text-gray-500 dark:text-gray-300">
                      <span className="border-t-brand-primary/60 mr-2 h-3 w-3 animate-spin rounded-full border-2 border-gray-200"></span>
                      Searching...
                    </span>
                  ) : isFilteringRef.current ? (
                    <span className="ml-3 inline-flex items-center text-sm text-gray-500 dark:text-gray-300">
                      <span className="border-t-brand-primary/60 mr-2 h-3 w-3 animate-spin rounded-full border-2 border-gray-200"></span>
                      Filtering...
                    </span>
                  ) : null)}
              </h2>
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {pagedVerified.length > 0 ? (
                  <>
                    {pagedVerified.map((campaign) => (
                      <CampaignCard key={campaign.id} campaign={campaign} />
                    ))}
                    <LaunchCampaignCTA />
                  </>
                ) : (
                  <>
                    <div className="col-span-full text-center text-gray-500">{noVerifiedMessage}</div>
                    <LaunchCampaignCTA />
                  </>
                )}
              </div>
              {(verifiedMeta?.total_items ?? filteredVerifiedCampaigns.length) > 0 && (
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
              )}
            </div>
          )}

          {verifiedFilter !== 'verified' && (
            <div
              ref={(el) => {
                unverifiedSectionRef.current = el;
              }}
              className="mt-10 pb-10"
            >
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                Unverified Campaigns
                {isLoadingUnverified &&
                  (debouncedSearch.trim() !== '' || isSearchingRef.current ? (
                    <span className="ml-3 inline-flex items-center text-sm text-gray-500 dark:text-gray-300">
                      <span className="border-t-brand-primary/60 mr-2 h-3 w-3 animate-spin rounded-full border-2 border-gray-200"></span>
                      Searching...
                    </span>
                  ) : isFilteringRef.current ? (
                    <span className="ml-3 inline-flex items-center text-sm text-gray-500 dark:text-gray-300">
                      <span className="border-t-brand-primary/60 mr-2 h-3 w-3 animate-spin rounded-full border-2 border-gray-200"></span>
                      Filtering...
                    </span>
                  ) : null)}
              </h2>
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {pagedUnverified.length > 0 ? (
                  <>
                    {pagedUnverified.map((campaign) => (
                      <CampaignCard key={campaign.id} campaign={campaign} />
                    ))}
                    <LaunchCampaignCTA />
                  </>
                ) : (
                  <>
                    <div className="col-span-full text-center text-gray-500">{noUnverifiedMessage}</div>
                    <LaunchCampaignCTA />
                  </>
                )}
              </div>
              {(unverifiedMeta?.total_items ?? filteredUnverifiedCampaigns.length) > 0 && (
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
              )}
            </div>
          )}

          <ContactCard />
        </section>
      )}
    </>
  );
};
