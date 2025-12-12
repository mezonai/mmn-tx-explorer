import { useMutation, useQueryClient } from '@tanstack/react-query';
import { UploadImageRequest } from '../type';
import { DonationCampaignService } from '../api';
import { QUERY_KEYS } from '../constants';

export const useUploadDonationImages = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UploadImageRequest) => DonationCampaignService.uploadDonationImages(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DONATION_FEED] });
    },
  });
};
