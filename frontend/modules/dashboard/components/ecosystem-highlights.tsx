'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ROUTES } from '@/configs/routes.config';
import { Skeleton } from '@/components/ui/skeleton';
import { useTopRaisedRatioCampaign } from '@/modules/donation-campaign/hooks/useTopRaisedRatioCampaign';
import { APP_CONFIG } from '@/configs/app.config';

export const EcosystemHighlights = () => {
  const { campaign, percentageDisplay, barPercentage, isLoading, error } = useTopRaisedRatioCampaign();
  const router = useRouter();

  const donationRef = useRef<HTMLAnchorElement | null>(null);
  const [refHeight, setRefHeight] = useState<number | null>(null);

  useLayoutEffect(() => {
    const update = () => {
      if (donationRef.current) {
        const rect = donationRef.current.getBoundingClientRect();
        const h = rect.height;
        if (h && h !== refHeight) setRefHeight(h);
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [campaign, isLoading, error, refHeight]);

  useEffect(() => {
    if (refHeight) {
      console.log('[EcosystemHighlights] Applying minHeight to other cards:', refHeight);
    }
  }, [refHeight]);

  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold">Ecosystem Highlights</h2>
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          ref={donationRef}
          href={ROUTES.DONATION_CAMPAIGN}
          className="bg-card hover:border-primary/50 dark:hover:border-primary/50 block cursor-pointer rounded-xl border border-gray-300 p-6 shadow-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-link)] dark:border-gray-700 dark:bg-slate-800 dark:shadow-sm"
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="flex items-center gap-2 font-semibold">Donation Campaigns</span>
            <i className="fa-solid fa-hand-holding-heart text-[var(--color-brand-link)]"></i>
          </div>
          {isLoading ? (
            <div>
              <Skeleton className="mb-3 h-4 w-56 bg-gray-200 dark:bg-gray-700" />
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <Skeleton className="h-2 w-1/2 bg-[var(--color-brand-link)]" />
              </div>
            </div>
          ) : campaign ? (
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <span
                  className="cursor-pointer rounded-sm font-medium hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-link)]"
                  role="link"
                  tabIndex={0}
                  title={`Open ${campaign.name}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (campaign?.slug) router.push(ROUTES.CAMPAIGN(campaign.slug));
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                      if (campaign?.slug) router.push(ROUTES.CAMPAIGN(campaign.slug));
                    }
                  }}
                >
                  {campaign.name} – {percentageDisplay}% goal reached
                </span>
              </p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <div className="h-2 bg-[var(--color-brand-link)]" style={{ width: `${barPercentage}%` }} />
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {error ? 'Unable to load campaigns right now.' : 'No active donation campaigns yet.'}
            </p>
          )}
        </Link>

        <div
          className="bg-card hover:border-primary/50 dark:hover:border-primary/50 flex flex-col rounded-xl border border-gray-300 p-6 shadow-sm transition-colors dark:border-gray-700 dark:bg-slate-800 dark:shadow-sm"
          style={refHeight ? { minHeight: refHeight } : undefined}
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="font-semibold">Lucky Money</span>
            <div className="flex items-center gap-2">
              <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-amber-700 uppercase dark:bg-amber-900/30 dark:text-amber-300">
                Coming Soon
              </span>
              <i className="fa-solid fa-gift text-[var(--color-brand-link)] dark:text-red-400"></i>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            0 envelopes active • 0 {APP_CONFIG.CHAIN_SYMBOL} total
          </p>
        </div>

        <div
          className="bg-card hover:border-primary/50 dark:hover:border-primary/50 flex flex-col rounded-xl border border-gray-300 p-6 shadow-sm transition-colors dark:border-gray-700 dark:bg-slate-800 dark:shadow-sm"
          style={refHeight ? { minHeight: refHeight } : undefined}
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="font-semibold">Stake</span>
            <div className="flex items-center gap-2">
              <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-amber-700 uppercase dark:bg-amber-900/30 dark:text-amber-300">
                Coming Soon
              </span>
              <i className="fa-solid fa-seedling text-[var(--color-brand-link)] dark:text-green-400"></i>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">0 {APP_CONFIG.CHAIN_SYMBOL} staked</p>
        </div>

        <div
          className="bg-card hover:border-primary/50 dark:hover:border-primary/50 flex flex-col rounded-xl border border-gray-300 p-6 shadow-sm transition-colors dark:border-gray-700 dark:bg-slate-800 dark:shadow-sm"
          style={refHeight ? { minHeight: refHeight } : undefined}
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="font-semibold">Swap</span>
            <div className="flex items-center gap-2">
              <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-amber-700 uppercase dark:bg-amber-900/30 dark:text-amber-300">
                Coming Soon
              </span>
              <i className="fa-solid fa-right-left text-[var(--color-brand-link)] dark:text-blue-400"></i>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">24h volume: 0 {APP_CONFIG.CHAIN_SYMBOL}</p>
        </div>

        <Link
          href={ROUTES.COBAR}
          className="bg-card hover:border-primary/50 dark:hover:border-primary/50 flex flex-col rounded-xl border border-gray-300 p-6 shadow-sm transition-colors dark:border-gray-700 dark:bg-slate-800 dark:shadow-sm"
          style={refHeight ? { minHeight: refHeight } : undefined}
          onClick={(e) => {
            e.preventDefault();
            router.push(ROUTES.COBAR);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              router.push(ROUTES.TRANSFER);
            }
          }}
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="font-semibold">Cobar.vn</span>
            <div className="flex items-center gap-2">
              <i className="fa-solid fa-store text-orange-400"></i>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Integrated Mezon payment marketplace</p>
        </Link>

        <div
          className="bg-card hover:border-primary/50 dark:hover:border-primary/50 flex flex-col rounded-xl border border-gray-300 p-6 shadow-sm transition-colors dark:border-gray-700 dark:bg-slate-800 dark:shadow-sm"
          style={refHeight ? { minHeight: refHeight } : undefined}
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="font-semibold">Mezon Games</span>
            <div className="flex items-center gap-2">
              <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-amber-700 uppercase dark:bg-amber-900/30 dark:text-amber-300">
                Coming Soon
              </span>
              <i className="fa-solid fa-gamepad text-[var(--color-brand-link)] dark:text-pink-400"></i>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">0 active titles • 0 players online</p>
        </div>

        <Link
          href={ROUTES.TRANSFER}
          className="bg-card hover:border-primary/50 dark:hover:border-primary/50 block flex cursor-pointer flex-col rounded-xl border border-gray-300 p-6 shadow-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-link)] dark:border-gray-700 dark:bg-slate-800"
          style={refHeight ? { minHeight: refHeight } : undefined}
          onClick={(e) => {
            e.preventDefault();
            router.push(ROUTES.TRANSFER);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              router.push(ROUTES.TRANSFER);
            }
          }}
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="font-semibold">Give Coffee</span>
            <i className="fa-solid fa-mug-saucer text-[var(--color-brand-link)] dark:text-yellow-400"></i>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">0 cups sent (on-chain + payment)</p>
        </Link>
      </div >
    </section >
  );
};
