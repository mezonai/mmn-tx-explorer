import type { Metadata } from 'next';

import { DonationCampaign } from '@/modules/donation-campaign/components';

export const metadata: Metadata = {
  title: 'Donation Campaign',
};

export default function DonationCampaignPage() {
  return <DonationCampaign />;
}
