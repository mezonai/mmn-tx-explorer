import { useQuery } from '@tanstack/react-query';
import { ChatService } from '../api';
import { P2P_QUERY_KEYS } from '../constants';

export const useChatHistory = (channelId: string | null, enabled = true) => {
  return useQuery({
    queryKey: [P2P_QUERY_KEYS.CHAT_HISTORY, channelId],
    queryFn: () => ChatService.getHistory(channelId!),
    enabled: enabled && !!channelId,
    refetchOnWindowFocus: false,
  });
};
