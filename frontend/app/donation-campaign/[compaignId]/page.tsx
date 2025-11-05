import { DonationCampaignService } from '@/modules/donation-campaign';
import { CampaignDetail } from '@/modules/donation-campaign/components';
import { ROUTES } from '@/configs/routes.config';
import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

interface CampaignDetailPageProps {
  params: Promise<{
    compaignId: string;
  }>;
}

export async function generateMetadata({ params }: CampaignDetailPageProps): Promise<Metadata> {
  const { compaignId } = await params;

  try {
    const result = await DonationCampaignService.getCampaignByIdOrSlug(compaignId);
    return {
      title: result.campaign.name || `Campaign ${compaignId}`,
      description: result.campaign.description,
    };
  } catch {
    return {
      title: `Campaign ${compaignId}`,
    };
  }
}

export default async function DonationCampaignDetailPage({ params }: CampaignDetailPageProps) {
  try {
    const { compaignId } = await params;

    const result = await DonationCampaignService.getCampaignByIdOrSlug(compaignId);

    if (result.shouldRedirect && result.redirectSlug) {
      redirect(ROUTES.CAMPAIGN(result.redirectSlug));
    }

    return <CampaignDetail campaign={result.campaign} />;
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
