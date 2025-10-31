import { useEffect } from 'react';
import { CampaignCard } from './campaign-card';
import { useCampaigns } from '../../../hooks/useCampaigns';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';
import { ECampaignStatus } from '@/modules/donation-campaign/type';

export const TopCampaign = () => {
  // Fetch top 3 active campaigns sorted by total amount raised
  const { campaigns, isLoading, error } = useCampaigns({
    page: 1,
    limit: 3,
    status: String(ECampaignStatus.Active),
    order: 'desc',
    order_by: 'total_amount',
  });

  useEffect(() => {
    if (error) {
      toast.error('Failed to load campaigns. Please try again later.');
    }
  }, [error]);

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

  if (!campaigns.length || !!error) {
    return null;
  }

  return (
    <>
      <section className="">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Featured campaigns</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Discover the most successful campaigns making a real impact in our community.
          </p>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {campaigns.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      </section>

      <Separator className="bg-gray-200/70 dark:bg-gray-800" />
    </>
  );
};
