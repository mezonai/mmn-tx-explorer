import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { RedEnvelopeService } from '../api';
import { CreateRedEnvelopeRequest } from '../type';
import { QUERY_KEYS } from '../constants';

export function useCreateRedEnvelope(){
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRedEnvelopeRequest) => RedEnvelopeService.createRedEnvelope(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.RED_ENVELOPES] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.RED_ENVELOPE_STATS_BY_USER] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CREATED_ENVELOPES]})
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.RED_ENVELOPE_STATS] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to create session: ${error.message}`);
    },
  });
}