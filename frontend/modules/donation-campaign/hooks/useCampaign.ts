import { useQuery } from '@tanstack/react-query';
import { DonationCampaignService } from '../api';
import { QUERY_KEYS } from '../constants';

export const useCampaign = (id: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.CAMPAIGN, id],
    queryFn: () => DonationCampaignService.getCampaignById(id),
    enabled: !!id,
  });
};
