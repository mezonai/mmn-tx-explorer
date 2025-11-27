import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ClaimEnvelopeRequest } from "../type";
import { RedEnvelopeService } from "../api";
import { QUERY_KEYS } from "../constants";
import { toast } from "sonner";
import { UUID } from "crypto";

export function useClaimRedEnvelope() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: UUID; data: ClaimEnvelopeRequest }) =>
      RedEnvelopeService.claimRedEnvelope(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.RED_ENVELOPES] });
      toast.success('Claim Red envelope successfully!');
    },
    onError: (error: Error) => {
      const errorMessage = error.message 
                           || 'Failed to claim red envelope';
      toast.error(errorMessage);
    }
  })
}

export function useClaimAmount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: UUID}) =>
      RedEnvelopeService.getClaimAmount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.RED_ENVELOPES] });
    },
    onError: (error: Error) => {
      const errorMessage = error.message || 'Failed to claim red envelope';
      toast.error(errorMessage);
    }
  })
}
