import { useQuery } from '@tanstack/react-query';
import { ChatService } from '../api';
import { P2P_QUERY_KEYS } from '../constants';

export const useChatChannel = (offerCreatorId: string, orderCreatorId: string, enabled = true) => {
  return useQuery({
    queryKey: [P2P_QUERY_KEYS.CHAT_CHANNEL, offerCreatorId, orderCreatorId],
    queryFn: () => ChatService.findChannel({ offerCreatorId, orderCreatorId }),
    enabled: enabled && !!offerCreatorId && !!orderCreatorId,
    staleTime: Infinity, // Channel usually doesn't change for a trade
  });
};
