import { CreateUpdate } from '@/modules/donation-campaign/components/campaign-updates';
import type { Metadata } from 'next';
import { ProtectedRoute } from '@/modules/auth/components/ProtectedRoute';
import { DonationCampaignService } from '@/modules/donation-campaign';
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Create Campaign Update',
};

interface CreateCampaignUpdatePageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function CreateCampaignUpdatePage({ params }: CreateCampaignUpdatePageProps) {
  const { slug } = await params;

  try {
    const campaign = await DonationCampaignService.getCampaignBySlug(slug);

    return (
      <ProtectedRoute>
        <CreateUpdate campaign={campaign} />
      </ProtectedRoute>
    );
  } catch (error) {
    console.error('Error fetching campaign:', error);
    notFound();
  }
}
