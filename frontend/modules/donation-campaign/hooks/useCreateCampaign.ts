import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DonationCampaignService } from '../api';
import type { CreateCampaignRequest } from '../type';
import { QUERY_KEYS } from '../constants';


export const useCreateCampaign = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCampaignRequest) => DonationCampaignService.createCampaign(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CAMPAIGNS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CAMPAIGN_STATS] });
    },
  });
};
