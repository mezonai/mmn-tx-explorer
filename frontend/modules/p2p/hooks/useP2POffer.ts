import { useQuery } from '@tanstack/react-query';
import { P2PService } from '../api';
import { P2P_QUERY_KEYS } from '../constants';

export const useP2POffer = (offerId: string | null) => {
    const { data, ...rest } = useQuery({
        queryKey: [P2P_QUERY_KEYS.OFFER, offerId],
        queryFn: () => P2PService.getOfferById(offerId!),
        enabled: !!offerId,
    });

    return {
        offer: data,
        ...rest,
    };
};
