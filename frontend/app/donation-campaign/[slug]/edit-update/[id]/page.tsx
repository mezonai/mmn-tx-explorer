import { EditUpdate } from '@/modules/donation-campaign/components/campaign-updates';
import type { Metadata } from 'next';
import { ProtectedRoute } from '@/modules/auth/components/ProtectedRoute';
import { DonationCampaignService, IDonationFeed, DonationFeedParams } from '@/modules/donation-campaign';
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Edit Campaign Update',
};

interface EditCampaignUpdatePageProps {
  params: Promise<{
    slug: string;
    id: string;
  }>;
}

export default async function EditCampaignUpdatePage({ params }: EditCampaignUpdatePageProps) {
  const { slug, id } = await params;
  const postId = Number(id);

  if (!postId) {
    notFound();
  }

  try {
    const campaign = await DonationCampaignService.getCampaignBySlug(slug);
    const feedResponse = await DonationCampaignService.getDonationFeed({
      address: campaign.donation_wallet,
    });

    let updatePost = feedResponse.data.find((post: IDonationFeed) => post.id === postId);

    if (!updatePost) {
      try {
        const feedResponse = await DonationCampaignService.getDonationFeed({
          address: campaign.donation_wallet,
          params: { isOwner: false } as DonationFeedParams,
        });
        updatePost = feedResponse.data.find((post: IDonationFeed) => post.id === postId);
      } catch (err) {
        console.warn('Owner feed fetch failed, continuing without it:', err);
      }
    }

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
