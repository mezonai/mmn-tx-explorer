import { useInfiniteQuery } from '@tanstack/react-query';
import { ChatService } from '../api';
import { P2P_QUERY_KEYS } from '../constants';

export const useChatHistory = (channelId: string | null, enabled = true) => {
  return useInfiniteQuery({
    queryKey: [P2P_QUERY_KEYS.CHAT_HISTORY, channelId],
    queryFn: ({ pageParam }) => ChatService.getHistory(channelId!, { before: pageParam }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage || lastPage.length === 0) return undefined;
      return lastPage[lastPage.length - 1].create_time_seconds;
    },
    enabled: enabled && !!channelId,
    refetchOnWindowFocus: false,
  });
};
