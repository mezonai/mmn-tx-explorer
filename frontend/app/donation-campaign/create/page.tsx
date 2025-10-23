import type { Metadata } from 'next';

import { CreateCampaign } from '@/modules/donation-campaign/components';

export const metadata: Metadata = {
  title: 'Create Campaign',
};

export default function CreateCampaignPage() {
  return <CreateCampaign />;
}
