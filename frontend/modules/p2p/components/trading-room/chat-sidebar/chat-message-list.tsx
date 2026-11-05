import { useEffect, useRef } from 'react';

import { cn } from '@/lib/utils';
import { useUser } from '@/providers';
import { MessageWithParsedContent } from '../../../types';
import { ChatMessageItem } from './chat-message-item';
import { SecurityAlert } from './security-alert';

interface ChatMessageListProps {
  messages: MessageWithParsedContent[];
  isMobileOpen: boolean;
}

export const ChatMessageList = ({ messages, isMobileOpen }: ChatMessageListProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { user } = useUser();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isMobileOpen]);

  return (
    <div
      ref={scrollRef}
      className={cn(
        'min-h-0 flex-1 space-y-1 overflow-y-auto p-4',
        '[&::-webkit-scrollbar]:w-1.5',
        '[&::-webkit-scrollbar-track]:bg-transparent',
        '[&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-gray-800',
        'hover:[&::-webkit-scrollbar-thumb]:bg-gray-400 dark:hover:[&::-webkit-scrollbar-thumb]:bg-gray-700',
        '[&::-webkit-scrollbar-thumb]:rounded-full'
      )}
    >
      <SecurityAlert />

      {messages.map((message, idx) => (
        <ChatMessageItem
          key={message.message_id}
          message={message}
          prevMessage={messages[idx - 1]}
          nextMessage={messages[idx + 1]}
          currentUserId={user?.id}
        />
      ))}
    </div>
  );
};
