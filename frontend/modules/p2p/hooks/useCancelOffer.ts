import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { P2PService } from '../api';
import { P2P_QUERY_KEYS } from '../constants';

const WS_INVALIDATE_DELAY = 1000;

export const useCancelOffer = () => {
  const queryClient = useQueryClient();
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mutation = useMutation({
    mutationFn: (offerId: string) => P2PService.cancelOffer(offerId),

    onSettled: (_data, _error, offerId) => {
      if (!offerId) return;

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: [P2P_QUERY_KEYS.OFFER, offerId],
        });
        queryClient.invalidateQueries({
          queryKey: [P2P_QUERY_KEYS.MY_OFFERS],
        });
        queryClient.invalidateQueries({
          queryKey: [P2P_QUERY_KEYS.OFFERS],
        });
      }, WS_INVALIDATE_DELAY);
    },
  });

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return mutation;
};
