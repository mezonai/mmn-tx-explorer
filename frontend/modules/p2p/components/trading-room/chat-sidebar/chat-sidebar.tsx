'use client';

import { useState } from 'react';
import { MessageCircle, Paperclip, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AutoMessagePayload } from '../../../types';
import { ChatComposer } from './chat-composer';
import { ChatMessageList } from './chat-message-list';
import { useChatAttachments } from './useChatAttachments';
import { useFileDropZone } from './useFileDropZone';
import { useTradingChat } from './useTradingChat';
import { MAX_FILE_SIZE_MB } from './utils';

interface ChatSidebarProps {
  sellerId: string;
  autoMessage?: AutoMessagePayload | null;
  onAutoMessageSent?: () => void;
}

export const ChatSidebar = ({ sellerId, autoMessage, onAutoMessageSent }: ChatSidebarProps) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const { messages, isConnected, unreadCount, socketRef, channelIdRef } = useTradingChat({
    sellerId,
    autoMessage,
    onAutoMessageSent,
    isMobileOpen,
  });
  const attachments = useChatAttachments();
  const { isDragging, dropZoneProps } = useFileDropZone(attachments.addFiles);

  return (
    <>
      <Button
        size="icon"
        onClick={() => setIsMobileOpen(true)}
        className={cn(
          'bg-brand-primary fixed right-6 bottom-6 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition-all active:scale-95 md:hidden',
          'hover:bg-brand-primary/90',
          isMobileOpen && 'scale-0 opacity-0'
        )}
      >
        <MessageCircle className="size-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-black">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Button>

      <div
        {...dropZoneProps}
        className={cn(
          'fixed inset-0 z-50 flex h-full flex-col bg-white transition-transform duration-300 md:sticky md:top-24 md:z-0 md:flex md:h-[calc(100vh-140px)] md:w-87.5 md:translate-y-0 lg:w-125 dark:bg-black dark:md:border-gray-800',
          isMobileOpen ? 'translate-y-0' : 'translate-y-full md:translate-y-0'
        )}
      >
        {isDragging && (
          <div className="bg-brand-primary/10 border-brand-primary animate-in fade-in zoom-in absolute inset-0 z-[60] m-2 flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed backdrop-blur-[2px] transition-all duration-200">
            <div className="text-brand-primary flex flex-col items-center gap-2">
              <Paperclip className="h-12 w-12 animate-bounce" />
              <p className="text-lg font-bold">Drop files here</p>
              <p className="text-xs opacity-70">max {MAX_FILE_SIZE_MB} MB</p>
            </div>
          </div>
        )}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 p-4 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">Trading Room</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileOpen(false)}
            className="rounded-full p-2 hover:bg-gray-100 md:hidden dark:hover:bg-gray-800"
          >
            <X className="h-5 w-5 text-gray-500" />
          </Button>
        </div>

        <ChatMessageList messages={messages} isMobileOpen={isMobileOpen} />

        <ChatComposer
          socketRef={socketRef}
          channelIdRef={channelIdRef}
          isConnected={isConnected}
          attachments={attachments}
        />
      </div>
    </>
  );
};
