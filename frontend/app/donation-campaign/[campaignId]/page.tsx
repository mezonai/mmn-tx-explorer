import { CampaignDetail } from '@/modules/donation-campaign/components';
import { Metadata } from 'next';

interface CampaignDetailPageProps {
  params: Promise<{
    campaignId: string;
  }>;
}

export async function generateMetadata({ params }: CampaignDetailPageProps): Promise<Metadata> {
  const { campaignId } = await params;

  return {
    title: `Campaign ${campaignId}`,
  };
}

export default async function DonationCampaignDetailPage({ params }: CampaignDetailPageProps) {
  const { campaignId } = await params;
  return <CampaignDetail campaignId={campaignId} />;
}
