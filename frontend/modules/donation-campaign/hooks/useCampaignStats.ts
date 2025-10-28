import { useQuery } from '@tanstack/react-query';
import { DonationCampaignService } from '../api';
import { QUERY_KEYS } from '../constants';
import type { CampaignStats } from '../type';

export const useCampaignStats = () => {
  const { data } = useQuery<CampaignStats>({
    queryKey: [QUERY_KEYS.CAMPAIGN_STATS],
    queryFn: () => DonationCampaignService.getStats(),
  });

  const fallback: CampaignStats = {
    total_campaigns_active: 0,
    total_amount: 0,
    total_contributors: 0,
  };

  return {
    stats: data ?? fallback,
  };
};
