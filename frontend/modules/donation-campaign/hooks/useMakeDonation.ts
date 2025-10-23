import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DonationCampaignService } from '../api';
import { QUERY_KEYS } from '../constants';

export const useMakeDonation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { campaignId: string; amount: number; message?: string }) =>
      DonationCampaignService.makeDonation(data),
    onSuccess: (_, variables) => {
      // Invalidate campaigns to refresh the data
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CAMPAIGNS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CAMPAIGN, variables.campaignId] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CAMPAIGN_STATS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USER_DONATIONS] });
    },
  });
};
