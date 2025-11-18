import { useQuery } from '@tanstack/react-query';
import { DonationCampaignService } from '../api';
import { QUERY_KEYS } from '../constants';

export const useCampaign = (slug: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.CAMPAIGN, slug],
    queryFn: () => DonationCampaignService.getCampaignBySlug(slug),
    enabled: !!slug,
  });
};
