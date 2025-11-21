import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SwapService } from '../api';
import type { CreateSwapHistoryRequest } from '../types';
import { QUERY_KEYS } from '../constants';
import { toast } from 'sonner';

export const useCreateSwapHistory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSwapHistoryRequest) => SwapService.createSwapHistory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SWAP_HISTORY] });
      toast.success('Swap history saved successfully');
    },
    onError: (error: any) => {
      console.error('Failed to save swap history:', error);
      toast.error('Failed to save swap history');
    },
  });
};
