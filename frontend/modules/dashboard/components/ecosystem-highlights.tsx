'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ROUTES } from '@/configs/routes.config';
import { Skeleton } from '@/components/ui/skeleton';
import { useTopRaisedRatioCampaign } from '@/modules/donation-campaign/hooks/useTopRaisedRatioCampaign';
import { APP_CONFIG } from '@/configs/app.config';
import { useRedEnvelopeStats } from '@/modules/lucky-money/hooks';
import { useGames } from '@/modules/mezon-game/hooks/useGames';
import { HandHeart, Gift, Sprout, Store, Gamepad2 } from 'lucide-react';
import { Transaction } from '@/assets/icons';
import { Chip } from '@/components/shared';

export const EcosystemHighlights = () => {
  const { campaign, percentageDisplay, barPercentage, isLoading, error } = useTopRaisedRatioCampaign();
  const router = useRouter();
  const { data: gameResponse } = useGames({
    sortField: 'createdAt',
    sortOrder: 'DESC',
  });
  const redEnvelopeStats = useRedEnvelopeStats();

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
            <HandHeart className="text-brand-primary h-6 w-6" />
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
        <Link href={ROUTES.LUCKY_MONEY}>
          <div
            className="bg-card hover:border-primary/50 dark:hover:border-primary/50 flex flex-col rounded-xl border border-gray-300 p-6 shadow-sm transition-colors dark:border-gray-700 dark:bg-slate-800 dark:shadow-sm"
            style={refHeight ? { minHeight: refHeight } : undefined}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="font-semibold">Lucky Money</span>
              <div className="flex items-center gap-2">
                <Gift className="text-brand-primary h-6 w-6 dark:text-red-400" />
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {redEnvelopeStats.stats.total_active_envelopes} envelopes active •{' '}
              {redEnvelopeStats.stats.total_claimed.toLocaleString('en-US')} {APP_CONFIG.CHAIN_SYMBOL} total
            </p>
          </div>
        </Link>

        <div
          className="bg-card hover:border-primary/50 dark:hover:border-primary/50 flex flex-col rounded-xl border border-gray-300 p-6 shadow-sm transition-colors dark:border-gray-700 dark:bg-slate-800 dark:shadow-sm"
          style={refHeight ? { minHeight: refHeight } : undefined}
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="font-semibold">Stake</span>
            <div className="flex items-center gap-2">
              <Chip variant="warning" size="sm">
                Coming Soon{' '}
              </Chip>
              <Sprout className="text-brand-primary h-6 w-6 dark:text-green-400" />
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
              <Chip variant="warning" size="sm">
                Coming Soon{' '}
              </Chip>
              <Transaction className="text-brand-primary h-6 w-6 dark:text-blue-400" />
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
              <Store className="text-brand-primary h-6 w-6 dark:text-orange-400" />
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Integrated Mezon payment marketplace</p>
        </Link>
        <Link
          href={ROUTES.MEZON_GAME}
          className="bg-card hover:border-primary/50 dark:hover:border-primary/50 flex flex-col rounded-xl border border-gray-300 p-6 shadow-sm transition-colors dark:border-gray-700 dark:bg-slate-800 dark:shadow-sm"
          style={refHeight ? { minHeight: refHeight } : undefined}
          onClick={(e) => {
            e.preventDefault();
            router.push(ROUTES.MEZON_GAME);
          }}
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="font-semibold">Mezon Games</span>
            <div className="flex items-center gap-2">
              <Gamepad2 className="text-brand-primary h-6 w-6 dark:text-pink-400" />
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {gameResponse?.totalCount} active games are waiting for you
          </p>
        </Link>
      </div>
    </section>
  );
};
