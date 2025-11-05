import { useQuery } from '@tanstack/react-query';
import { DonationCampaignService } from '../api';
import { QUERY_KEYS } from '../constants';

export const useCampaign = (campaignId: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.CAMPAIGN, campaignId],
    queryFn: () => DonationCampaignService.getCampaignById(campaignId),
    enabled: !!campaignId,
  });
};
