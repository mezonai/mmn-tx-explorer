import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DonationCampaignService } from '../api';
import { QUERY_KEYS } from '../constants';

export const useCloseCampaign = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => DonationCampaignService.closeCampaign(id),
    onSuccess: () => {
      // Invalidate campaigns to refresh the data
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CAMPAIGNS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CAMPAIGN_STATS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USER_DONATIONS] });
    },
  });
};
