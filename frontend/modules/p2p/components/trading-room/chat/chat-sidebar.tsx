'use client';

import { Lock } from 'lucide-react';
import { ChatMessages } from './chat-messages';
import { ChatInput } from './chat-input';
import { ChatMessage } from '../../../types/p2p.types';

interface ChatSidebarProps {
  messages: ChatMessage[];
  currentUserId: string;
  onSendMessage: (content: string) => void;
  isLoading?: boolean;
}

export const ChatSidebar = ({ messages, currentUserId, onSendMessage, isLoading }: ChatSidebarProps) => {
  return (
    <div className="hidden md:flex w-5/12 lg:w-4/12 flex-col bg-[#0f131a] dark:bg-[#0f131a] border-l border-gray-800">
      <div className="p-4 border-b border-gray-800 text-center text-sm font-bold text-gray-400 bg-card/50 flex items-center justify-center gap-2">
        Mezon Secure Chat <Lock className="h-3 w-3 text-green-500" />
      </div>

      <ChatMessages messages={messages} currentUserId={currentUserId} />

      <ChatInput onSend={onSendMessage} disabled={isLoading} />
    </div>
  );
};




