import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CreateOfferRequest } from '../types';
import { P2PService } from '../api';
import { P2P_QUERY_KEYS } from '../constants';

export const useCreateOffer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateOfferRequest) => P2PService.createOffers(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [P2P_QUERY_KEYS.OFFERS] });
    },
  });
};
