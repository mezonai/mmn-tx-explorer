import { useQuery } from '@tanstack/react-query';
import { DonationCampaignService } from '../api';
import type { CampaignListParams } from '../type';
import { QUERY_KEYS } from '../constants';

export const useCampaigns = (params: CampaignListParams = {}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.CAMPAIGNS, params],
    queryFn: () => DonationCampaignService.getCampaigns(params),
  });
};
