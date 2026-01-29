'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLightClient, useUser } from '@/providers';
import { LightSocket } from 'mezon-light-sdk';
import { STORAGE_KEYS } from '@/constant';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { DateTimeUtil } from '@/utils';
import { safeJsonParse } from '@/utils/json-parse.utils';
import { ChannelMessage, MAX_CHAR_LIMIT, MessageWithParsedContent, ParsedMessageContent } from '@/modules/p2p';
import { formatChatTime, generateMarkdownPayload, isSameDay } from '@/modules/p2p/util';

interface CampaignChatWidgetProps {
  creatorId: string;
  campaignTitle?: string;
}

export const CampaignChatWidget = ({ creatorId, campaignTitle }: CampaignChatWidgetProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<MessageWithParsedContent[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<LightSocket | null>(null);
  const channelIdRef = useRef<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isOpenRef = useRef(isOpen);

  const { lightClient } = useLightClient();
  const { user } = useUser();

  useEffect(() => {
    isOpenRef.current = isOpen;
    if (isOpen) {
      setUnreadCount(0);
      scrollToBottom();
    }
  }, [isOpen]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      setTimeout(() => {
        scrollRef.current!.scrollTop = scrollRef.current!.scrollHeight;
      }, 100);
    }
  };

  useEffect(() => {
    if (!lightClient || !creatorId || !user) return;
    if (user.id === creatorId) return;

    let isMounted = true;

    const initChat = async () => {
      try {
        const isExpired = await lightClient.isSessionExpired();
        if (isExpired) {
          await lightClient.refreshSession();
          localStorage.setItem(STORAGE_KEYS.LIGHT_CLIENT, JSON.stringify(lightClient));
        }
        if (!isMounted) return;

        const sdk = lightClient;
        const socket = new LightSocket(sdk, sdk.getSession());
        await socket.connect();
        socketRef.current = socket;

        const channel = await sdk.createDM(creatorId);
        await socket.joinDMChannel(channel.channel_id!);
        channelIdRef.current = channel.channel_id!;

        socket.setChannelMessageHandler((msg: ChannelMessage) => {
          console.log(msg);
          let parsedContent: ParsedMessageContent = { t: '' };
          if (typeof msg.content === 'string') {
            parsedContent = safeJsonParse(msg.content) ?? { t: msg.content };
          } else if (msg.content && typeof msg.content === 'object') {
            parsedContent = msg.content as ParsedMessageContent;
          }

          if (!parsedContent || (!parsedContent.t && !parsedContent.embed)) return;

          const isValidSender = msg.sender_id === user?.id || msg.sender_id === creatorId;
          if (!isValidSender) return;

          const isMe = msg.sender_id === user?.id;

          const normalizedMessage: MessageWithParsedContent = {
            ...msg,
            content: parsedContent,
          };

          setMessages((prev) => {
            if (prev.find((m) => m.message_id === normalizedMessage.message_id)) return prev;
            const newMessages = [...prev, normalizedMessage];
            return newMessages.sort((a, b) => (a.create_time_seconds || 0) - (b.create_time_seconds || 0));
          });

          scrollToBottom();

          if (!isMe && !isOpenRef.current) {
            setUnreadCount((prev) => prev + 1);
          }
        });

        if (isMounted) {
          setIsConnected(true);
        }
      } catch (err) {
        console.error('Failed to initialize chat:', err);
      }
    };

    initChat();
    return () => {
      isMounted = false;
      socketRef.current?.disconnect();
    };
  }, [lightClient, creatorId, user?.id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !socketRef.current || !channelIdRef.current) return;

    const content = inputValue;
    setInputValue('');

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      const mk = generateMarkdownPayload(content);
      await socketRef.current.sendDM({
        channelId: channelIdRef.current,
        content: {
          mk: mk,
          t: content,
        },
      });
      scrollToBottom();
    } catch (err) {
      console.error('Send DM failed:', err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  if (user?.id === creatorId) return null;

  return (
    <>
      <div
        className={cn(
          'fixed right-6 bottom-6 z-50 transition-all duration-300',
          isOpen ? 'hidden md:flex' : 'flex',
          isOpen && 'md:hidden'
        )}
      >
        <Button
          onClick={() => setIsOpen(true)}
          className={cn(
            'h-14 w-14 rounded-full shadow-lg transition-transform duration-200 active:scale-95',
            'bg-brand-primary hover:bg-brand-primary/90 text-white'
          )}
        >
          <div className="relative">
            <MessageCircle className="h-7 w-7" />
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-red-500 text-[10px] font-bold dark:border-zinc-900">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
        </Button>
      </div>

      {/* 2. Chat Window Main */}
      <div
        className={cn(
          // --- BASE ---
          'fixed z-100 flex flex-col bg-white shadow-2xl transition-all duration-300 dark:bg-zinc-950',
          // --- MOBILE  ---
          'inset-0 h-dvh w-full',
          // --- DESKTOP ---
          'md:inset-auto md:right-10 md:bottom-0 md:h-[550px] md:w-[380px] md:rounded-t-xl md:rounded-b-none md:border-x md:border-t md:border-b-0 md:border-gray-200 md:dark:border-gray-800',
          isOpen ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none translate-y-full opacity-0'
        )}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 bg-white/80 p-4 backdrop-blur-md md:md:rounded-t-xl dark:border-gray-800 dark:bg-zinc-950/80">
          <div className="flex items-center gap-3">
            <div className="relative h-9 w-9 shrink-0">
              <div className="bg-brand-primary/10 text-brand-primary flex h-full w-full items-center justify-center rounded-full font-bold">
                {(campaignTitle || 'C').charAt(0).toUpperCase()}
              </div>
              {isConnected && (
                <span className="absolute right-0 bottom-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white dark:ring-zinc-950" />
              )}
            </div>
            <div>
              <h3 className="line-clamp-1 text-sm font-bold text-gray-900 dark:text-gray-100">
                {campaignTitle || 'Campaign Support'}
              </h3>
              <p className="text-muted-foreground text-xs">{isConnected ? 'Online' : 'Connecting...'}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Messages Area */}
        <div
          ref={scrollRef}
          className={cn(
            'flex-1 space-y-1 overflow-y-auto p-4',
            '[&::-webkit-scrollbar]:w-1.5',
            '[&::-webkit-scrollbar-track]:bg-transparent',
            '[&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-gray-800',
            '[&::-webkit-scrollbar-thumb]:rounded-full'
          )}
        >
          {messages.length === 0 && isConnected && (
            <div className="text-muted-foreground flex h-full flex-col items-center justify-center p-6 text-center opacity-60">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-zinc-800">
                <MessageCircle className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-sm font-medium">No messages yet</p>
              <p className="mt-1 text-xs">Send a message to start the conversation.</p>
            </div>
          )}

          {messages.map((msg, idx) => {
            const isMe = msg.sender_id === user?.id;
            const prevMsg = messages[idx - 1];
            const nextMsg = messages[idx + 1];

            const msgTimestamp = msg.create_time_seconds ?? Math.floor(Date.now() / 1000);
            const prevTimestamp = prevMsg?.create_time_seconds ?? Math.floor(Date.now() / 1000);

            const showDateDivider = !prevMsg || !isSameDay(msgTimestamp, prevTimestamp);

            const isFirstInGroup = !prevMsg || prevMsg.sender_id !== msg.sender_id || showDateDivider;
            const isLastInGroup = !nextMsg || nextMsg.sender_id !== msg.sender_id;

            return (
              <div key={msg.message_id}>
                {/* Date Divider */}
                {showDateDivider && (
                  <div className="my-6 flex items-center justify-center">
                    <span className="rounded-full border border-gray-200 bg-gray-100 px-3 py-1 text-[10px] font-bold text-gray-500 uppercase dark:border-gray-800 dark:bg-zinc-900">
                      {DateTimeUtil.formatShortDate(msgTimestamp)}
                    </span>
                  </div>
                )}

                <div
                  className={cn(
                    'flex max-w-[85%] flex-col',
                    isMe ? 'ml-auto items-end' : 'mr-auto items-start',
                    isLastInGroup ? 'mb-4' : 'mb-0.5'
                  )}
                >
                  {isFirstInGroup && !isMe && (
                    <span className="mb-1 ml-10 px-1 text-[10px] font-bold tracking-tight text-gray-400 uppercase">
                      {msg.display_name}
                    </span>
                  )}

                  <div className={cn('flex w-full items-end gap-2', isMe ? 'flex-row-reverse' : 'flex-row')}>
                    {!isMe && (
                      <div className="w-8 shrink-0">
                        {isLastInGroup ? (
                          msg.avatar ? (
                            <img
                              src={msg.avatar}
                              alt="avatar"
                              className="h-8 w-8 rounded-full border border-gray-100 bg-gray-200 object-cover"
                            />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-[10px] font-bold text-gray-600 uppercase dark:bg-zinc-800 dark:text-gray-300">
                              {(msg.display_name || 'U').charAt(0)}
                            </div>
                          )
                        ) : (
                          <div className="w-8" />
                        )}
                      </div>
                    )}

                    <div
                      className={cn(
                        'overflow-wrap-anywhere w-fit max-w-full px-3 py-2 text-sm wrap-break-word whitespace-pre-wrap shadow-sm transition-colors',
                        isMe
                          ? 'bg-brand-primary text-white'
                          : 'bg-gray-100 text-gray-800 dark:bg-zinc-800 dark:text-gray-200',
                        'rounded-2xl',
                        isMe
                          ? isFirstInGroup
                            ? 'rounded-tr-none'
                            : 'rounded-tr-md'
                          : isFirstInGroup
                            ? 'rounded-tl-none'
                            : 'rounded-tl-md',
                        !isLastInGroup && (isMe ? 'rounded-br-md' : 'rounded-bl-md')
                      )}
                    >
                      {msg.content.t}
                    </div>
                  </div>

                  {isLastInGroup && (
                    <div className={cn('mt-1 px-1 text-[9px] font-bold text-gray-400 uppercase', !isMe && 'ml-10')}>
                      {formatChatTime(msgTimestamp)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Input Area */}
        <div className="pb-safe shrink-0 border-t border-gray-200 bg-white p-3 md:pb-3 dark:border-gray-800 dark:bg-zinc-950">
          <form onSubmit={handleSendMessage} className="relative flex items-end gap-2">
            <Textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value.slice(0, MAX_CHAR_LIMIT));
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
              }}
              onKeyDown={handleKeyDown}
              placeholder="Type message..."
              rows={1}
              className={cn(
                'max-h-[120px] min-h-[44px] w-full resize-none shadow-none',
                'bg-gray-50 dark:bg-zinc-900',
                'focus:ring-brand-primary border-transparent',
                'rounded-xl py-2.5 pr-12 pl-4',
                'text-sm'
              )}
            />
            <Button
              type="submit"
              disabled={!inputValue.trim() || !isConnected}
              size="icon"
              variant="ghost"
              className={cn(
                'absolute right-2 bottom-1.5 h-9 w-9',
                'text-brand-primary hover:bg-brand-primary/10',
                'disabled:opacity-40'
              )}
            >
              {isConnected ? <Send className="h-5 w-5" /> : <Loader2 className="h-5 w-5 animate-spin" />}
            </Button>
          </form>
        </div>
      </div>
    </>
  );
};
