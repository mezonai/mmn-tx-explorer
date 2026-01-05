'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ROUTES } from '@/configs/routes.config';
import { useTopRaisedRatioCampaign } from '@/modules/donation-campaign/hooks/useTopRaisedRatioCampaign';
import { APP_CONFIG } from '@/configs/app.config';
import { useRedEnvelopeStats } from '@/modules/lucky-money/hooks';
import { useGames } from '@/modules/mezon-game/hooks/useGames';
import { useP2PStats } from '@/modules/p2p/hooks';
import { HandHeart, Gift, Sprout, Store, Gamepad2, Coffee } from 'lucide-react';
import { Transaction } from '@/assets/icons';
import { EcoCard } from './eco-card';

interface EcosystemHighlightsProps {
  giveCoffeeStats?: number;
}

export const EcosystemHighlights = ({ giveCoffeeStats }: EcosystemHighlightsProps) => {
  const { campaign, percentageDisplay, barPercentage, isLoading, error } = useTopRaisedRatioCampaign();
  const router = useRouter();
  const { data: gameResponse } = useGames({
    sortField: 'createdAt',
    sortOrder: 'DESC',
  });
  const redEnvelopeStats = useRedEnvelopeStats();
  const { data: p2pStats } = useP2PStats();

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
        <EcoCard
          ref={donationRef}
          title="Donation Campaigns"
          route={ROUTES.DONATION_CAMPAIGN}
          icon={<HandHeart className="text-brand-primary h-6 w-6" />}
          isLoading={isLoading}
        >
          {campaign ? (
            <>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <span
                  className="focus-visible:ring-brand-primary cursor-pointer rounded-sm font-medium hover:underline focus:outline-none focus-visible:ring-2"
                  role="link"
                  tabIndex={0}
                  title={`Open ${campaign.name}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (campaign?.slug) router.push(ROUTES.CAMPAIGN(campaign.slug));
                  }}
                >
                  {campaign.name} – {percentageDisplay}% goal reached
                </span>
              </p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <div className="bg-brand-primary h-2" style={{ width: `${barPercentage}%` }} />
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {error ? 'Unable to load campaigns right now.' : 'No active donation campaigns yet.'}
            </p>
          )}
        </EcoCard>

        <EcoCard
          title="Lucky Money"
          route={ROUTES.LUCKY_MONEY}
          icon={<Gift className="text-brand-primary h-6 w-6 dark:text-red-400" />}
          description={`${redEnvelopeStats.stats.total_active_envelopes} envelopes active • ${redEnvelopeStats.stats.total_claimed.toLocaleString('en-US')} ${APP_CONFIG.CHAIN_SYMBOL} total`}
        />
        <EcoCard
          title="P2P Trading"
          icon={<Sprout className="text-brand-primary h-6 w-6 dark:text-green-400" />}
          route={ROUTES.P2P}
        >
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <div>{p2pStats?.totalOffers || 0} active offers</div>
            <div>
              Total available: {(p2pStats?.totalAvailableAmount || 0).toLocaleString('en-US')}{' '}
              {APP_CONFIG.CHAIN_SYMBOL}
            </div>
          </div>
        </EcoCard>
        <EcoCard
          title="Swap"
          icon={<Transaction className="text-brand-primary h-6 w-6 dark:text-blue-400" />}
          description={`24h volume: 0 ${APP_CONFIG.CHAIN_SYMBOL}`}
          comingSoon
        />

        <EcoCard
          title="Cobar.vn"
          icon={<Store className="text-brand-primary h-6 w-6 dark:text-orange-400" />}
          description="Integrated Mezon payment marketplace"
          route={ROUTES.COBAR}
        />
        <EcoCard
          title="Mezon Games"
          icon={<Gamepad2 className="text-brand-primary h-6 w-6 dark:text-pink-400" />}
          description={`${gameResponse?.totalCount} active games are waiting for you`}
          route={ROUTES.MEZON_GAME}
        />
        <EcoCard
          title="Give Coffee"
          icon={<Coffee className="text-brand-primary h-6 w-6 dark:text-yellow-400" />}
          route={ROUTES.TRANSFER}
          description={`${giveCoffeeStats ?? 0} cups sent (on-chain + payment)`}
        />
      </div>
    </section>
  );
};
