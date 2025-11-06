import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DonationCampaignService } from '../api';
import { QUERY_KEYS } from '../constants';

export const useActiveCampaign = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: string; slug?: string }) => DonationCampaignService.activateCampaign(id),
    onSuccess: (_data, { id, slug }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CAMPAIGNS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CAMPAIGN_STATS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USER_DONATIONS] });
      if (id) {
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CAMPAIGN, id] });
      }
      if (slug) {
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CAMPAIGN, slug] });
      }
    },
  });
};
