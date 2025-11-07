import { DonationCampaignService } from '@/modules/donation-campaign';
import { CampaignDetail } from '@/modules/donation-campaign/components';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';

interface CampaignDetailPageProps {
  params: Promise<{
    campaignId: string;
  }>;
}

export async function generateMetadata({ params }: CampaignDetailPageProps): Promise<Metadata> {
  const { campaignId } = await params;
  try {
    const campaign = await DonationCampaignService.getCampaignById(campaignId);

    return {
      title: campaign.name || `Campaign ${campaignId}`,
      description: campaign.description,
    };
  } catch (error) {
    return {
      title: `Campaign ${campaignId}`,
    };
  }
}

export default async function DonationCampaignDetailPage({ params }: CampaignDetailPageProps) {
  try {
    const { campaignId } = await params;
    const campaign = await DonationCampaignService.getCampaignById(campaignId);
    return <CampaignDetail campaign={campaign} />;
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'response' in error) {
      const httpError = error as { response: { status: number } };
      if (httpError.response.status === 404) {
        notFound();
      }
    }

    throw error;
  }
}
