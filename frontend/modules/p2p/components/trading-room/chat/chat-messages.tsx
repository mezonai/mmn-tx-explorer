'use client';

import { ChatMessage } from '../../../types';
import { ChatMessageItem } from './chat-message-item';
import { AlertTriangle } from 'lucide-react';

interface ChatMessagesProps {
  messages: ChatMessage[];
  currentUserId: string;
}

export const ChatMessages = ({ messages, currentUserId }: ChatMessagesProps) => {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => (
        <ChatMessageItem key={message.id} message={message} currentUserId={currentUserId} />
      ))}

      {/* Warning Banner */}
      <div className="flex justify-center mt-4">
        <div className="bg-red-900/20 text-red-400 text-xs px-4 py-2 rounded border border-red-900/30 text-center max-w-[90%] flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>
            Warning: Do not provide your wallet password, OTP, or private key to anyone, even support staff.
          </span>
        </div>
      </div>
    </div>
  );
};




