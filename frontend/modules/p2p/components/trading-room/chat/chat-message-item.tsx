'use client';

import { ChatMessage } from '../../../types';
import { cn } from '@/lib/utils';

interface ChatMessageItemProps {
  message: ChatMessage;
  currentUserId: string;
}

export const ChatMessageItem = ({ message, currentUserId }: ChatMessageItemProps) => {
  const isBuyer = message.senderType === 'buyer';
  const isSeller = message.senderType === 'seller';
  const isSystem = message.senderType === 'system';
  const isCurrentUser = message.senderId === currentUserId;

  if (isSystem) {
    return (
      <div className="flex justify-center">
        <div className="bg-gray-800 text-gray-400 text-xs px-3 py-1 rounded-full border border-gray-700">
          {message.content}
        </div>
      </div>
    );
  }

  const getInitials = (senderId: string) => {
    return senderId.charAt(0).toUpperCase();
  };

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
        {getInitials(message.senderId)}
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




