import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DonationCampaignService } from '../api';
import { QUERY_KEYS } from '../constants';

export const usePublishCampaign = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => DonationCampaignService.publishCampaign(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CAMPAIGNS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CAMPAIGN_STATS] });
    },
  });
};
