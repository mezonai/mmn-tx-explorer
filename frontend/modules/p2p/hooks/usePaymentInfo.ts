import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { P2PService } from '../api';
import { P2P_QUERY_KEYS } from '../constants';
import { UserPaymentInfo } from '../types';

export const useUserPaymentInfos = () => {
    return useQuery({
        queryKey: [P2P_QUERY_KEYS.USER_PAYMENTS],
        queryFn: () => P2PService.getMyPaymentInfos(),
    });
};

export const useUpdatePaymentInfo = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Partial<UserPaymentInfo>) => P2PService.updatePaymentInfo(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [P2P_QUERY_KEYS.USER_PAYMENTS] });
        },
    });
};

export const useDeletePaymentInfo = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string | number) => P2PService.deletePaymentInfo(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [P2P_QUERY_KEYS.USER_PAYMENTS] });
        },
    });
};

