import { useQuery } from '@tanstack/react-query';
import { DonationCampaignService } from '../api';
import { QUERY_KEYS } from '../constants';

export function useTopContributor({ params, campaignId }: { campaignId: string; params: { limit: number } }) {
  return useQuery({
    queryKey: [QUERY_KEYS.TOP_CONTRIBUTOR, campaignId, params],
    queryFn: () => DonationCampaignService.getTopContributor({ campaignId, params }),
    enabled: !!campaignId,
  });
}