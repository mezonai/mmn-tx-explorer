import { useMutation, useQueryClient } from '@tanstack/react-query';
import { P2PService } from '../api';
import { P2P_QUERY_KEYS } from '../constants';
import { toast } from 'sonner';

export const useReopenOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => P2PService.reopenOrder(orderId),
    onSuccess: () => {
      toast.success('Order reopened successfully');
      // Invalidate queries to refresh the order list
      queryClient.invalidateQueries({ queryKey: [P2P_QUERY_KEYS.MY_ORDERS] });
      queryClient.invalidateQueries({ queryKey: [P2P_QUERY_KEYS.ORDER] });
      queryClient.invalidateQueries({ queryKey: [P2P_QUERY_KEYS.ORDERS] });
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || 'Failed to reopen order';
      toast.error(errorMessage);
    },
  });
};
