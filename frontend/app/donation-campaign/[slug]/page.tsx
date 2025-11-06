import { DonationCampaignService } from '@/modules/donation-campaign';
import { CampaignDetail } from '@/modules/donation-campaign/components';
import { ROUTES } from '@/configs/routes.config';
import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

interface CampaignDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: CampaignDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const isNumericId = /^\d+$/.test(slug);

  if (isNumericId) {
    try {
      const campaign = await DonationCampaignService.getCampaignById(slug);
      return {
        title: campaign.name || `Campaign ${slug}`,
        description: campaign.description,
      };
    } catch {
      return {
        title: `Campaign ${slug}`,
      };
    }
  } else {
    try {
      const campaign = await DonationCampaignService.getCampaignBySlug(slug);
      return {
        title: campaign.name || `Campaign ${slug}`,
        description: campaign.description,
      };
    } catch {
      return {
        title: `Campaign ${slug}`,
      };
    }
  }
}

export default async function DonationCampaignDetailPage({ params }: CampaignDetailPageProps) {
  try {
    const { slug } = await params;
    const isNumericId = /^\d+$/.test(slug);

    if (isNumericId) {
      try {
        const campaign = await DonationCampaignService.getCampaignById(slug);
        if (campaign.slug) {
          redirect(ROUTES.CAMPAIGN(campaign.slug));
        }

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
    } else {
      try {
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
