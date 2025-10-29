import { useQuery } from '@tanstack/react-query';
import { DonationCampaignService } from '../api';
import type { CampaignListParams } from '../type';
import { QUERY_KEYS } from '../constants';

export const useCampaigns = (params: CampaignListParams) => {
  const {
    data: campaignsResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: [QUERY_KEYS.CAMPAIGNS, params],
    queryFn: () => DonationCampaignService.getCampaigns({ ...params, page: params.page - 1 }),
  });

  return {
    campaigns: campaignsResponse?.data || [],
    meta: campaignsResponse?.meta,
    isLoading,
    error,
  };
};
