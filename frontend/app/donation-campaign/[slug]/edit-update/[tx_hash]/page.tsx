import { EditUpdate } from '@/modules/donation-campaign/components/campaign-updates';
import type { Metadata } from 'next';
import { ProtectedRoute } from '@/modules/auth/components/ProtectedRoute';
import { DonationCampaignService } from '@/modules/donation-campaign';
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Edit Campaign Update',
};

interface EditCampaignUpdatePageProps {
  params: Promise<{
    slug: string;
    tx_hash: string;
  }>;
}

export default async function EditCampaignUpdatePage({ params }: EditCampaignUpdatePageProps) {
  const { slug, tx_hash } = await params;

  if (!tx_hash) {
    notFound();
  }

  try {
    const feedPost = DonationCampaignService.getDonationFeedPostDetail(tx_hash);
    const currentCampaign = DonationCampaignService.getCampaignBySlug(slug);
    const [feedPostResult, currentCampaignResult] = await Promise.all([feedPost, currentCampaign]);

    if (!feedPost || !currentCampaign) {
      notFound();
    }
    return (
      <ProtectedRoute>
        <EditUpdate campaign={currentCampaignResult} updatePost={feedPostResult} />
      </ProtectedRoute>
    );
  } catch (error) {
    console.error('Error fetching campaign or update:', error);
    notFound();
  }
}
