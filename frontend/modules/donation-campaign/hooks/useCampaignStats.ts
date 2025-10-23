import { useQuery } from '@tanstack/react-query';
import { DonationCampaignService } from '../api';
import { QUERY_KEYS } from '../constants';

export const useCampaignStats = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.CAMPAIGN_STATS],
    queryFn: () => DonationCampaignService.getStats(),
  });
};
