'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, AlertTriangle, Loader2, MessageCircle, X, Info, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLightClient, useUser } from '@/providers';
import { ChannelMessage, LightSocket } from 'mezon-light-sdk';
import { STORAGE_KEYS } from '@/constant';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { formatChatTime, generateMarkdownPayload, isSameDay } from '../../util';
import { P2POrder } from '../../types';
import { APP_CONFIG } from '@/configs/app.config';
import { ROUTES } from '@/configs/routes.config';
import { NumberUtil } from '@/utils';

interface ChatSidebarProps {
  sellerId: string;
  initialOrder?: P2POrder | null;
  onInitialMessageSent?: () => void;
}

const MAX_CHAR_LIMIT = 5000;

export const ChatSidebar = ({ sellerId, initialOrder, onInitialMessageSent }: ChatSidebarProps) => {
  const [messages, setMessages] = useState<ChannelMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<LightSocket | null>(null);
  const channelIdRef = useRef<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isMobileOpenRef = useRef(isMobileOpen);

  // --- OPTIMIZATION REFS ---
  // Sử dụng Refs để lưu props, giúp truy cập giá trị mới nhất trong effect mà không cần re-run effect
  const initialOrderRef = useRef(initialOrder);
  const onInitialMessageSentRef = useRef(onInitialMessageSent);
  const hasSentAutoMessageRef = useRef(false);

  const { lightClient } = useLightClient();
  const { user } = useUser();

  const [showLimitWarning, setShowLimitWarning] = useState(false);

  // Sync props to refs
  useEffect(() => {
    initialOrderRef.current = initialOrder;
    onInitialMessageSentRef.current = onInitialMessageSent;
  }, [initialOrder, onInitialMessageSent]);

  useEffect(() => {
    isMobileOpenRef.current = isMobileOpen;
    if (isMobileOpen) {
      setUnreadCount(0);
    }
  }, [isMobileOpen]);

  // --- MAIN INIT LOGIC (Optimized) ---
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
        const socket = new LightSocket(sdk.getClient(), sdk.getSession());
        await socket.connect();
        socketRef.current = socket;

        const channel = await sdk.createDM(sellerId);
        await socket.joinDMChannel(channel.channel_id);
        channelIdRef.current = channel.channel_id;

        socket.setChannelMessageHandler((msg: ChannelMessage) => {
          if (!msg.content || !msg.content.t || msg.content.t.trim() === '') return;
          const isValidSender = msg.sender_id === user?.id || msg.sender_id === sellerId;
          if (!isValidSender) return;

          const isMe = msg.sender_id === user?.id;
          console.log('new message', msg);
          setMessages((prev) => {
            if (prev.find((m) => m.message_id === msg.message_id)) return prev;
            return [...prev, msg];
          });

          if (!isMe && !isMobileOpenRef.current) {
            setUnreadCount((prev) => prev + 1);
          }
        });

        if (initialOrderRef.current && !hasSentAutoMessageRef.current && channelIdRef.current) {
          console.log('Sending optimized order embed...');
          try {
            hasSentAutoMessageRef.current = true;

            const order = initialOrderRef.current;
            const mzdAmount = NumberUtil.formatWithCommas(order.amount);
            const vndAmount = NumberUtil.formatWithCommas(order.amount * order.price_rate);
            const fullUrl = process.env.NEXT_PUBLIC_CHAT_APP_ZK_API_URL || window.location.origin;
            const domain = new URL(fullUrl).origin;
            const orderLink = `${domain}${ROUTES.P2P_TRADING_ROOM(order.order_id)}`;

            const textContent = `Hello, I would like to buy your offer. Please check the order details below.`;
            const mk = generateMarkdownPayload(textContent);

            const embedElement = {
              color: '#6366f1',
              title: `Click here to view Order #${order.order_id}`,
              url: orderLink,
              description: 'New P2P Order',
              fields: [
                {
                  name: 'Buy Amount',
                  value: `${mzdAmount} ${APP_CONFIG.CHAIN_SYMBOL}`,
                  inline: true,
                },
                {
                  name: 'Total Price',
                  value: `${vndAmount} VND`,
                  inline: true,
                },
                {
                  name: 'Exchange Rate',
                  value: `${NumberUtil.formatWithCommas(order.price_rate)}  VND/${APP_CONFIG.CHAIN_SYMBOL}`,
                  inline: true,
                },
              ],
              timestamp: new Date().toISOString(),
              footer: {
                text: 'Mezon Dong P2P Trading',
              },
            };

            await socket.sendDM(channelIdRef.current, {
              mk: mk,
              t: textContent,
              embed: [embedElement],
            });

            if (onInitialMessageSentRef.current) {
              onInitialMessageSentRef.current();
            }
          } catch (err) {
            console.error('Failed to send auto message:', err);
            hasSentAutoMessageRef.current = false;
          }
        }

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

      await socketRef.current.sendDM(channelIdRef.current, {
        t: content,
        mk: mk,
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
            const showDateDivider = !prevMsg || !isSameDay(msg.create_time_seconds, prevMsg.create_time_seconds);
            const isFirstInGroup = !prevMsg || prevMsg.sender_id !== msg.sender_id || showDateDivider;
            const isLastInGroup =
              !nextMsg ||
              nextMsg.sender_id !== msg.sender_id ||
              (nextMsg && !isSameDay(msg.create_time_seconds, nextMsg.create_time_seconds));

            return (
              <div key={msg.message_id}>
                {showDateDivider && (
                  <div className="my-6 flex items-center justify-center">
                    <span className="rounded-full border border-gray-200 bg-gray-100 px-3 py-1 text-[10px] font-bold text-gray-500 uppercase dark:border-gray-800 dark:bg-gray-900">
                      {new Date(Number(msg.create_time_seconds) * 1000).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
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
                        'overflow-wrap-anywhere w-fit max-w-full rounded-2xl px-3 py-2 text-sm break-all whitespace-pre-wrap shadow-sm transition-colors',
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
                            {msg.content.embed[0].fields && (
                              <div className="grid grid-cols-1 gap-1 text-xs opacity-90">
                                {msg.content.embed[0].fields.map((field: any, i: number) => (
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
                      {formatChatTime(msg.create_time_seconds)}
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
