import { DonationCampaignService } from '../../api';
import { CampaignDetailClient } from './shared/campaign-detail-client';

interface CampaignDetailProps {
  campaignId: string;
}

export const CampaignDetail = async ({ campaignId }: CampaignDetailProps) => {
  const campaignDetail = {
    created_at: '2025-12-24T08:55:12Z',
    creator: '1946198449917530112',
    description:
      'Provide insulated jackets, gloves, and heaters for 800 students living in remote northern mountains ahead of winter.',
    wallet: '9PPsJBJpVYAKYVzxfCgH3HRkvGfw4sTvEF5dzq5jc1tX',
    end_date: '2025-12-31T23:59:59Z',
    goal: 1000000,
    id: '3',
    name: 'Warm Clothes for Highland Kids',
    status: 2,
    total_amount: 250000,
    total_contributors: 42,
    updated_at: '2025-10-24T08:55:40Z',
    url: 'http://88/swa',
  };
  return <CampaignDetailClient campaign={campaignDetail} />;
};
