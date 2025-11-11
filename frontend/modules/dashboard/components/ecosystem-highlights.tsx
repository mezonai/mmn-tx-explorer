"use client";

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
      <h2 className="text-xl font-semibold mb-4">Ecosystem Highlights</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">

        <Link
          ref={donationRef}
          href={ROUTES.DONATION_CAMPAIGN}
          className="block cursor-pointer bg-card dark:bg-[#1e293b] border border-gray-300 dark:border-gray-700 rounded-xl p-6 hover:border-primary/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(105,65,198)]"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold flex items-center gap-2">Donation Campaigns</span>
            <i className="fa-solid fa-hand-holding-heart text-[rgb(105,65,198)]"></i>
          </div>
          {isLoading ? (
            <div>
              <Skeleton className="h-4 w-56 mb-3 bg-gray-200 dark:bg-gray-700" />
              <div className="mt-3 rounded-full h-2 overflow-hidden bg-gray-200 dark:bg-gray-700">
                <Skeleton className="h-2 w-1/2 bg-[rgb(105,65,198)]" />
              </div>
            </div>
          ) : campaign ? (
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                <span
                  className="hover:underline font-medium cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(105,65,198)] rounded-sm"
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
              <div className="mt-3 rounded-full h-2 overflow-hidden bg-gray-200 dark:bg-gray-700">
                <div
                  className="h-2 bg-[rgb(105,65,198)]"
                  style={{ width: `${barPercentage}%` }}
                />
              </div>
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {error ? 'Unable to load campaigns right now.' : 'No active donation campaigns yet.'}
            </p>
          )}
        </Link>

        <div
          className="bg-card dark:bg-[#1e293b] border border-gray-300 dark:border-gray-700 rounded-xl p-6 hover:border-primary/50 transition-colors flex flex-col"
          style={refHeight ? { minHeight: refHeight } : undefined}
        >
          <div className="flex items-center justify-between mb-3"><span className="font-semibold flex items-center gap-2">Lì xì <span className="text-[10px] tracking-wide font-semibold rounded px-2 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 uppercase">Coming Soon</span></span><i className="fa-solid fa-gift text-red-400"></i></div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">0 envelopes active • 0 {APP_CONFIG.CHAIN_SYMBOL} total</p>
        </div>

        <div
          className="bg-card dark:bg-[#1e293b] border border-gray-300 dark:border-gray-700 rounded-xl p-6 hover:border-primary/50 transition-colors flex flex-col"
          style={refHeight ? { minHeight: refHeight } : undefined}
        >
          <div className="flex items-center justify-between mb-3"><span className="font-semibold flex items-center gap-2">Stake <span className="text-[10px] tracking-wide font-semibold rounded px-2 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 uppercase">Coming Soon</span></span><i className="fa-solid fa-seedling text-green-400"></i></div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">0 {APP_CONFIG.CHAIN_SYMBOL} staked</p>
        </div>

        <div
          className="bg-card dark:bg-[#1e293b] border border-gray-300 dark:border-gray-700 rounded-xl p-6 hover:border-primary/50 transition-colors flex flex-col"
          style={refHeight ? { minHeight: refHeight } : undefined}
        >
          <div className="flex items-center justify-between mb-3"><span className="font-semibold flex items-center gap-2">Swap <span className="text-[10px] tracking-wide font-semibold rounded px-2 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 uppercase">Coming Soon</span></span><i className="fa-solid fa-right-left text-blue-400"></i></div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">24h volume: 0 {APP_CONFIG.CHAIN_SYMBOL}</p>
        </div>

        <div
          className="bg-card dark:bg-[#1e293b] border border-gray-300 dark:border-gray-700 rounded-xl p-6 hover:border-primary/50 transition-colors flex flex-col"
          style={refHeight ? { minHeight: refHeight } : undefined}
        >
          <div className="flex items-center justify-between mb-3"><span className="font-semibold flex items-center gap-2">Cobar.vn <span className="text-[10px] tracking-wide font-semibold rounded px-2 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 uppercase">Coming Soon</span></span><i className="fa-solid fa-store text-orange-400"></i></div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Integrated Mezon payment marketplace</p>
        </div>

        <div
          className="bg-card dark:bg-[#1e293b] border border-gray-300 dark:border-gray-700 rounded-xl p-6 hover:border-primary/50 transition-colors flex flex-col"
          style={refHeight ? { minHeight: refHeight } : undefined}
        >
          <div className="flex items-center justify-between mb-3"><span className="font-semibold flex items-center gap-2">Mezon Games <span className="text-[10px] tracking-wide font-semibold rounded px-2 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 uppercase">Coming Soon</span></span><i className="fa-solid fa-gamepad text-pink-400"></i></div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">0 active titles • 0 players online</p>
        </div>

        <Link
          href={ROUTES.TRANSFER}
          className="block cursor-pointer bg-card dark:bg-[#1e293b] border border-gray-300 dark:border-gray-700 rounded-xl p-6 hover:border-primary/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(105,65,198)] flex flex-col"
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
          <div className="flex items-center justify-between mb-3"><span className="font-semibold">Give Coffee</span><i className="fa-solid fa-mug-saucer text-yellow-400"></i></div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">0 cups sent (on-chain + payment)</p>
        </Link>
      </div>
    </section>
  );
};
