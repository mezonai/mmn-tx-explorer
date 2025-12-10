'use client';

import { ChatMessage } from '../../../types';
import { cn } from '@/lib/utils';

interface ChatMessageItemProps {
  message: ChatMessage;
  currentUserId: string;
}

export const ChatMessageItem = ({ message, currentUserId }: ChatMessageItemProps) => {
  const isBuyer = message.sender_type === 'buyer';
  const isSeller = message.sender_type === 'seller';
  const isCurrentUser = message.sender_id === currentUserId;

  const getAvatarColor = () => {
    if (isBuyer) return 'bg-brand-primary';
    if (isSeller) return 'bg-blue-600';
    return 'bg-gray-600';
  };

  return (
    <div className={cn('flex gap-2', isBuyer && 'flex-row-reverse')}>
      <div
        className={cn(
          'w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white shadow',
          getAvatarColor()
        )}
      >
        {message.sender_id.charAt(0).toUpperCase()}
      </div>
      <div
        className={cn(
          'rounded-xl p-3 text-sm max-w-[80%] shadow-sm',
          isBuyer
            ? 'bg-brand-primary rounded-l-xl rounded-br-xl text-white'
            : 'bg-gray-800 rounded-r-xl rounded-bl-xl text-gray-200'
        )}
      >
        {message.content}
      </div>
    </div>
  );
};




