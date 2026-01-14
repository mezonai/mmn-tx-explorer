'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ROUTES } from '@/configs/routes.config';
import { UpdateList } from './update-list';
import { DonationCampaign } from '@/modules/donation-campaign';
import { FileX2Icon, Loader2 } from 'lucide-react';
import { useUser } from '@/providers';
import { useDonationFeed } from '@/modules/donation-campaign/hooks';
import { useEffect, useRef } from 'react';

interface DonationFeedProps {
  campaign: DonationCampaign;
  isOwner: boolean;
  feedTitle: string;
  feedDescription: string;
}

export const DonationFeed = ({ campaign, isOwner = true, feedTitle, feedDescription }: DonationFeedProps) => {
  const { user } = useUser();
  const { donationFeed, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } = useDonationFeed(
    campaign.donation_wallet,
    { isOwner }
  );
  const isCampaignOwner = user?.id === campaign.creator;
  const canShowAddUpdate = !isOwner || (isOwner && isCampaignOwner);

  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="w-full space-y-6">
      <div className="flex w-full flex-row justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{feedTitle}</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{feedDescription}</p>
        </div>
        <div>
          {canShowAddUpdate && (
            <Link href={ROUTES.CREATE_DONATION_UPDATE(campaign.slug)} passHref>
              <Button variant="default" className="bg-brand-primary hover:bg-brand-primary/80 text-white">
                + Add Update
              </Button>
            </Link>
          )}
        </div>
      </div>
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="text-brand-primary h-12 w-12 animate-spin" />
        </div>
      )}
      {!isLoading && (error || donationFeed.length === 0) && (
        <div className="border-muted-foreground/50 bg-background flex flex-col items-center justify-center rounded-2xl border py-12">
          <FileX2Icon className="text-primary my-4 h-10 w-10" />
          <h3 className="text-primary mb-2 text-lg font-semibold">No Updates Yet</h3>
          <p className="text-muted-foreground px-4 text-sm">
            This campaign hasn't posted any updates yet. Check back later!
          </p>
        </div>
      )}

      {!isLoading && donationFeed && donationFeed.length > 0 && (
        <>
          <UpdateList updates={donationFeed} campaign={campaign} />

          {hasNextPage && (
            <div ref={observerTarget} className="flex justify-center py-4">
              {isFetchingNextPage && <Loader2 className="text-brand-primary h-8 w-8 animate-spin" />}
            </div>
          )}
        </>
      )}
    </div>
  );
};
