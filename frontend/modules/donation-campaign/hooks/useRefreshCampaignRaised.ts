import { useMutation } from '@tanstack/react-query';
import { DonationCampaignService } from '../api';
import { toast } from 'sonner';
import { DonationCampaign } from '../type';

interface UseRefreshCampaignRaisedOptions {
  onSuccess?: (campaign: DonationCampaign) => void;
  onError?: (error: Error) => void;
}

export function useRefreshCampaignRaised(options?: UseRefreshCampaignRaisedOptions) {
  return useMutation({
    mutationFn: (id: string) => DonationCampaignService.refreshCampaignRaised(id),
    onSuccess: (data) => {
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      toast.error('Failed to refresh campaign data');
      options?.onError?.(error);
    },
  });
}
