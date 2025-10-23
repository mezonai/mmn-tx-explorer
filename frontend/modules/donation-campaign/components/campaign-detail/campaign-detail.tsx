import { ComingSoon } from '@/components/shared';

interface CampaignDetailProps {
  campaignId: string;
}

export const CampaignDetail = async ({ campaignId }: CampaignDetailProps) => {
  return <ComingSoon title="Campaign Details" />;
};
