import { EditUpdate } from '@/modules/donation-campaign/components/campaign-updates';
import type { Metadata } from 'next';
import { ProtectedRoute } from '@/modules/auth/components/ProtectedRoute';
import { DonationCampaignService, IDonationFeed } from '@/modules/donation-campaign';
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Edit Campaign Update',
};

interface EditCampaignUpdatePageProps {
  params: Promise<{
    slug: string;
    txHash: string;
  }>;
}

export default async function EditCampaignUpdatePage({ params }: EditCampaignUpdatePageProps) {
  const { slug, txHash } = await params;

  if (!txHash) {
    notFound();
  }

  try {
    const campaign = await DonationCampaignService.getCampaignBySlug(slug);
    const feedResponse = await DonationCampaignService.getDonationFeed({
      address: campaign.donation_wallet,
    });

    // Find the post with the matching tx_hash
    const updatePost = feedResponse.data.find((post: IDonationFeed) => post.tx_hash === txHash);

    if (!updatePost) {
      notFound();
    }

    return (
      <ProtectedRoute>
        <EditUpdate campaign={campaign} updatePost={updatePost} />
      </ProtectedRoute>
    );
  } catch (error) {
    console.error('Error fetching campaign or update:', error);
    notFound();
  }
}
