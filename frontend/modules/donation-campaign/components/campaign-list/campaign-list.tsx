'use client';
import { Separator } from '@/components/ui/separator';
import { CSRDonation } from './csr-donation';
import { ActiveCampaign, TopCampaign } from './active-campaign';

export const DonationCampaign = () => {
  return (
    <div className="space-y-16 pb-16">
      <CSRDonation />

      <Separator className="bg-gray-200/70 dark:bg-gray-800" />

      <TopCampaign />

      <ActiveCampaign />
    </div>
  );
};
