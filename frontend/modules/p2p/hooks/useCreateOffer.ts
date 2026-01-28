import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CreateOfferRequest } from '../types';
import { P2PService } from '../api';
import { P2P_QUERY_KEYS } from '../constants';
import { toast } from 'sonner';

export const useCreateOffer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateOfferRequest) => P2PService.createOffers(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [P2P_QUERY_KEYS.OFFERS] });
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message;
      if (errorMessage) {
        toast.error('Failed to create offer', { description: errorMessage });
      }
    },
  });
};
