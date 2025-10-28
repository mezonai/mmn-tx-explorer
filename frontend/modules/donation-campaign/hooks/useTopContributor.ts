import { useQuery } from '@tanstack/react-query';
import { DonationCampaignService } from '../api';

export function useTopContributor(campaignId: string) {
  return useQuery({
    queryKey: ['top-contributors', campaignId],
    queryFn: () => DonationCampaignService.getTopContributor(campaignId),
    enabled: !!campaignId,
  });
}
