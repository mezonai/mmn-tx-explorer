import { DonationCampaignService } from '@/modules/donation-campaign';
import { CampaignDetail } from '@/modules/donation-campaign/components';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';

interface CampaignDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: CampaignDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const campaign = await DonationCampaignService.getCampaignBySlug(slug);

    return {
      title: campaign.name || `Campaign ${slug}`,
      description: campaign.description,
    };
  } catch (error) {
    return {
      title: `Campaign ${slug}`,
    };
  }
}

export default async function DonationCampaignDetailPage({ params }: CampaignDetailPageProps) {
  try {
    const { slug } = await params;
    const campaign = await DonationCampaignService.getCampaignBySlug(slug);
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
