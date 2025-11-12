import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DonationCampaignService } from '../api';
import { QUERY_KEYS } from '../constants';

export const useDeleteCampaign = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => DonationCampaignService.deleteCampaign(id),
    onSuccess: (_data, id) => {
      // Invalidate lists and specific campaign cache
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CAMPAIGNS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CAMPAIGN_STATS] });
      if (id) {
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CAMPAIGN, id] });
      }
    },
  });
};
