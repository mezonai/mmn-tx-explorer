'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, AlertTriangle, Loader2, MessageCircle, X, Info, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLightClient, useUser } from '@/providers';
import { LightSocket } from 'mezon-light-sdk';
import { STORAGE_KEYS } from '@/constant';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { formatChatTime, generateMarkdownPayload, isSameDay } from '../../util';
import { AutoMessagePayload, ChannelMessage, MessageWithParsedContent, ParsedMessageContent } from '../../types';
import { DateTimeUtil } from '@/utils';
import { safeJsonParse } from '@/utils/json-parse.utils';

interface ChatSidebarProps {
  sellerId: string;
  autoMessage?: AutoMessagePayload | null;
  onAutoMessageSent?: () => void;
}

const MAX_CHAR_LIMIT = 5000;

export const ChatSidebar = ({ sellerId, autoMessage, onAutoMessageSent }: ChatSidebarProps) => {
  const [messages, setMessages] = useState<MessageWithParsedContent[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showLimitWarning, setShowLimitWarning] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<LightSocket | null>(null);
  const channelIdRef = useRef<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isMobileOpenRef = useRef(isMobileOpen);

  const { lightClient } = useLightClient();
  const { user } = useUser();

  useEffect(() => {
    isMobileOpenRef.current = isMobileOpen;
    if (isMobileOpen) {
      setUnreadCount(0);
    }
  }, [isMobileOpen]);

  useEffect(() => {
    if (!lightClient) return;
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

        const channel = await sdk.createDM(sellerId);
        await socket.joinDMChannel(channel.channel_id!);
        channelIdRef.current = channel.channel_id!;

        socket.setChannelMessageHandler((msg: ChannelMessage) => {
          let parsedContent: ParsedMessageContent = { t: '' };
          if (typeof msg.content === 'string') {
            parsedContent = safeJsonParse(msg.content) ?? { t: msg.content };
          } else if (msg.content && typeof msg.content === 'object') {
            parsedContent = msg.content as ParsedMessageContent;
          }

          if (!parsedContent || !parsedContent.t || parsedContent.t.trim() === '') return;

          const isValidSender = msg.sender_id === user?.id || msg.sender_id === sellerId;
          if (!isValidSender) return;

          const isMe = msg.sender_id === user?.id;

          const normalizedMessage: MessageWithParsedContent = {
            ...msg,
            content: parsedContent,
          };

          setMessages((prev) => {
            if (prev.find((m) => m.message_id === normalizedMessage.message_id)) return prev;
            return [...prev, normalizedMessage];
          });

          if (!isMe && !isMobileOpenRef.current) {
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
    };
  }, [lightClient, sellerId, user?.id]);

  useEffect(() => {
    if (autoMessage && isConnected && socketRef.current && channelIdRef.current) {
      const sendMessage = async () => {
        try {
          const mk = generateMarkdownPayload(autoMessage.text);

          await socketRef.current?.sendDM({
            channelId: channelIdRef.current!,
            content: {
              t: autoMessage.text,
              mk: mk,
              embed: autoMessage.embed,
            },
          });

          if (onAutoMessageSent) {
            onAutoMessageSent();
          }
        } catch (err) {
          console.error('Failed to send auto message:', err);
        }
      };

      sendMessage();
    }
  }, [autoMessage, isConnected, onAutoMessageSent]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isMobileOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !socketRef.current || !channelIdRef.current) return;
    const content = inputValue;
    setInputValue('');
    setShowLimitWarning(false);
    try {
      const mk = generateMarkdownPayload(content);

      await socketRef.current.sendDM({
        channelId: channelIdRef.current,
        content: {
          mk: mk,
          t: content,
        },
      });
    } catch (err) {
      console.error('Send DM failed:', err);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const target = e.target;
    let newValue = target.value;
    if (newValue.length > MAX_CHAR_LIMIT) {
      newValue = newValue.slice(0, MAX_CHAR_LIMIT);
      setShowLimitWarning(true);
    } else {
      setShowLimitWarning(false);
    }
    setInputValue(newValue);
    target.style.height = 'auto';
    target.style.height = `${Math.min(target.scrollHeight, 150)}px`;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !inputValue.trim()) {
      e.preventDefault();
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    }
  };

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
        className={cn(
          'fixed inset-0 z-50 flex h-full flex-col bg-white transition-transform duration-300 md:sticky md:top-24 md:z-0 md:flex md:h-[calc(100vh-140px)] md:w-87.5 md:translate-y-0 lg:w-125 dark:bg-black dark:md:border-gray-800',
          isMobileOpen ? 'translate-y-0' : 'translate-y-full md:translate-y-0'
        )}
      >
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
          {/* Security Area */}
          <div className="mb-6 px-1">
            <div className="relative overflow-hidden rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
              <div className="mb-3 flex items-center gap-2 text-amber-600 dark:text-amber-500">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-[11px] font-bold tracking-wider uppercase">Security Awareness</span>
              </div>

              <div className="space-y-3 text-[12px] leading-relaxed">
                <p className="text-gray-600 dark:text-gray-300">
                  <span className="font-semibold text-amber-700 dark:text-amber-400">Important:</span> Support will{' '}
                  <span className="italic underline">never</span> ask for your wallet password or private keys. Never
                  disclose your credentials to anyone.
                </p>

                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-black/40">
                  <div className="mb-1 flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                    <Info className="h-3.5 w-3.5" />
                    <span className="text-[11px] font-semibold uppercase">Chat Guidance</span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-500">
                    To access your permanent chat logs and transaction history, please refer to{' '}
                    <span className="font-medium text-amber-600 dark:text-amber-500/80">Mezon</span>.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Render Messages */}
          {messages.map((msg, idx) => {
            const isMe = msg.sender_id === user?.id || msg.sender_id === 'me';
            const prevMsg = messages[idx - 1];
            const nextMsg = messages[idx + 1];
            const msgTimestamp = msg.create_time_seconds ?? Math.floor(Date.now() / 1000);
            const prevTimestamp = prevMsg?.create_time_seconds ?? Math.floor(Date.now() / 1000);
            const nextTimestamp = nextMsg?.create_time_seconds ?? Math.floor(Date.now() / 1000);
            const showDateDivider = !prevMsg || !isSameDay(msgTimestamp, prevTimestamp);
            const isFirstInGroup = !prevMsg || prevMsg.sender_id !== msg.sender_id || showDateDivider;
            const isLastInGroup =
              !nextMsg || nextMsg.sender_id !== msg.sender_id || (nextMsg && !isSameDay(msgTimestamp, nextTimestamp));

            return (
              <div key={msg.message_id}>
                {showDateDivider && (
                  <div className="my-6 flex items-center justify-center">
                    <span className="rounded-full border border-gray-200 bg-gray-100 px-3 py-1 text-[10px] font-bold text-gray-500 uppercase dark:border-gray-800 dark:bg-gray-900">
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
                  {isFirstInGroup && (
                    <span
                      className={cn(
                        'mb-1 px-1 text-[10px] font-bold tracking-tight text-gray-400 uppercase',
                        !isMe && 'ml-10'
                      )}
                    >
                      {msg.display_name} {isMe && '(You)'}
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
                              className="h-8 w-8 rounded-full border border-gray-100 object-cover"
                            />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-[10px] font-bold text-gray-600 uppercase">
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
                        'overflow-wrap-anywhere w-fit max-w-full rounded-2xl px-3 py-2 text-sm wrap-break-word whitespace-pre-wrap shadow-sm transition-colors',
                        isMe
                          ? 'bg-brand-primary text-white'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
                        isMe ? (isFirstInGroup ? 'rounded-tr-none' : '') : isFirstInGroup ? 'rounded-tl-none' : ''
                      )}
                    >
                      {msg.content.embed && msg.content.embed.length > 0 ? (
                        <div className="flex flex-col gap-2">
                          {msg.content.t && <p>{msg.content.t}</p>}

                          <div className="flex flex-col rounded-md border border-black/5 bg-black/5 p-3 dark:border-white/10 dark:bg-white/5">
                            {msg.content?.embed?.[0]?.fields && (
                              <div className="grid grid-cols-1 gap-1 text-xs opacity-90">
                                {msg.content.embed[0].fields.map((field, i: number) => (
                                  <div key={i} className="flex gap-1">
                                    <span className="opacity-70">{field.name}:</span>
                                    <span className="font-medium">{field.value}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        msg.content.t
                      )}
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
        <div className="shrink-0 border-t border-gray-200 bg-white p-4 pb-8 md:pb-4 dark:border-gray-800 dark:bg-black">
          {showLimitWarning && (
            <div className="animate-in fade-in slide-in-from-bottom-1 mb-2 flex items-center gap-2 rounded-md bg-red-50 p-2 text-xs text-red-600 dark:bg-red-900/20 dark:text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>Message limit reached. Maximum {MAX_CHAR_LIMIT} characters allowed.</span>
            </div>
          )}
          <form onSubmit={handleSendMessage} className="relative w-full">
            <Textarea
              ref={textareaRef}
              rows={1}
              value={inputValue}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className={cn(
                'max-h-50 min-h-10.5 w-full resize-none shadow-none',
                'bg-gray-50 dark:bg-gray-900',
                'border-gray-200 dark:border-gray-700',
                showLimitWarning ? 'border-red-300 focus:border-red-500' : 'focus:border-brand-primary',
                'focus:border-brand-primary focus:ring-0 focus-visible:ring-0',
                'text-sm text-gray-900 dark:text-white',
                'py-2.5 pr-12 pl-4',
                'overflow-y-auto break-all whitespace-pre-wrap'
              )}
            />
            <Button
              type="submit"
              disabled={!inputValue.trim()}
              variant="ghost"
              size="icon"
              className={cn(
                'absolute right-2 bottom-1.5',
                'h-auto w-auto p-1.5',
                'text-brand-primary hover:bg-brand-primary/10',
                'disabled:text-gray-400 dark:disabled:text-gray-600'
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
