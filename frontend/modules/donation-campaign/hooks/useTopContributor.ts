import { useQuery } from '@tanstack/react-query';
import { DonationCampaignService } from '../api';
import { QUERY_KEYS } from '../constants';

export function useTopContributor(campaignId: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.TOP_CONTRIBUTOR, campaignId],
    queryFn: () => DonationCampaignService.getTopContributor(campaignId),
    enabled: !!campaignId,
  });
}
