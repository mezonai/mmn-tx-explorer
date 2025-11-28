import { CreateUpdate } from '@/modules/donation-campaign/components/campaign-updates';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Campaign Update',
};

export default function CreateCampaignUpdatePage() {
  //TODO: add protected route here
  return <CreateUpdate />;
}
