import { useMutation, useQueryClient } from "@tanstack/react-query";
import { P2PService } from "../api";
import { P2P_QUERY_KEYS } from "../constants";

export const useCancelOffer = () => {
    const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (offerId: string) => P2PService.cancelOffer(offerId),
    onSuccess: (_data, id) => {
        // Invalidate relevant queries to refresh the data
        queryClient.invalidateQueries({ queryKey: [P2P_QUERY_KEYS.OFFER, id] });
        queryClient.invalidateQueries({ queryKey: [P2P_QUERY_KEYS.MY_OFFERS] });
        queryClient.invalidateQueries({ queryKey: [P2P_QUERY_KEYS.OFFERS] });
    },
  });
};