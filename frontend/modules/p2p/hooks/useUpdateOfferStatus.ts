import { useMutation, useQueryClient } from '@tanstack/react-query';
import { UpdateOfferStatusRequest } from '../types';
import { P2PService } from '../api';
import { P2P_QUERY_KEYS } from '../constants';

export const useUpdateOfferStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateOfferStatusRequest) => P2PService.updateOfferStatus(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [P2P_QUERY_KEYS.OFFERS] });
    },
  });
};
