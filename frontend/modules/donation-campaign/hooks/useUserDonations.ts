import { useQuery } from '@tanstack/react-query';
import { DonationCampaignService } from '../api';
import { QUERY_KEYS } from '../constants';

export const useUserDonations = (params: { page?: number; limit?: number } = {}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.USER_DONATIONS, params],
    queryFn: () => DonationCampaignService.getUserDonations(params),
  });
};
