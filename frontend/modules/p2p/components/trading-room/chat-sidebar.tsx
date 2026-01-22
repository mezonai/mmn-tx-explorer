'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, AlertTriangle, Loader2, MessageCircle, X, Info, AlertCircle, Paperclip, FileText, File } from 'lucide-react';
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
const MAX_FILE_SIZE = 100 * 1024 * 1024;

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} bytes`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} kB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileIcon = (filename: string, filetype?: string) => {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (filetype?.startsWith('image/')) return null;
  if (ext === 'pdf') return <FileText className="h-5 w-5 text-red-500" />;
  if (['doc', 'docx'].includes(ext || '')) return <FileText className="h-5 w-5 text-blue-500" />;
  if (['json', 'html', 'js', 'ts', 'jsx', 'tsx'].includes(ext || '')) return <FileText className="h-5 w-5 text-purple-500" />;
  return <File className="h-5 w-5 text-gray-500" />;
};

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<{ url: string; file: File }[]>([]);

  const isMobileOpenRef = useRef(isMobileOpen);
  const isMessageSendingRef = useRef(false);

  const initialOrderRef = useRef(initialOrder);
  const onInitialMessageSentRef = useRef(onInitialMessageSent);
  const hasSentAutoMessageRef = useRef(false);

  const { lightClient } = useLightClient();
  const { user } = useUser();

  const [showLimitWarning, setShowLimitWarning] = useState(false);

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
          const hasContent = msg.content && msg.content.t && msg.content.t.trim() !== '';
          const hasAttachments = msg.attachments && msg.attachments.length > 0;
          if (!hasContent && !hasAttachments) return;

          const isValidSender = msg.sender_id === user?.id || msg.sender_id === sellerId;
          if (!isValidSender) return;

          const isMe = msg.sender_id === user?.id;
          setMessages((prev) => {
            if (prev.find((m) => m.message_id === msg.message_id)) return prev;
            return [...prev, msg];
          });

          if (!isMe && !isMobileOpenRef.current) {
            setUnreadCount((prev) => prev + 1);
          }
        });

        if (initialOrderRef.current && !hasSentAutoMessageRef.current && channelIdRef.current) {
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

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const content = inputValue.trim();
    const hasContent = content.length > 0;
    const hasAttachments = selectedFiles.length > 0;

    if (isMessageSendingRef.current || (!hasContent && !hasAttachments) || !socketRef.current || !channelIdRef.current) {
      return;
    }

    isMessageSendingRef.current = true;
    setIsUploading(true);

    const filesToUpload = [...selectedFiles];
    setInputValue('');
    previews.forEach(p => {
      if (p.url && p.url.startsWith('blob:')) URL.revokeObjectURL(p.url);
    });
    setPreviews([]);
    setSelectedFiles([]);
    setShowLimitWarning(false);

    try {
      const finalAttachments: any[] = [];

      if (hasAttachments && lightClient) {
        for (let i = 0; i < filesToUpload.length; i++) {
          const file = filesToUpload[i];
          if (file.size > MAX_FILE_SIZE) continue;

          if (i > 0) {
            await new Promise(resolve => setTimeout(resolve, 1500));
          }

          let uploadSuccess = false;
          let retryCount = 0;
          const maxRetries = 3;

          while (!uploadSuccess && retryCount < maxRetries) {
            try {
              const uniqueName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${file.name}`;
              console.log(`[Chat] Uploading (${retryCount + 1}/${maxRetries}): ${uniqueName}`);

              const response = await lightClient.getPresignedUrl({
                filename: uniqueName,
                filetype: file.type || 'application/octet-stream',
                size: file.size,
              });

              if (response?.url) {
                const uploadRes = await fetch(response.url, {
                  method: 'PUT',
                  body: file,
                });

                if (uploadRes.ok) {
                  const urlObj = new URL(response.url);
                  const cdnUrl = `https://cdn.mezon.ai${urlObj.pathname}`;
                  finalAttachments.push({
                    filename: file.name,
                    url: cdnUrl,
                    size: file.size,
                    filetype: file.type || 'application/octet-stream',
                    file_type: file.type || 'application/octet-stream',
                  });
                  uploadSuccess = true;
                  console.log(`[Chat] Success: ${uniqueName}`);
                } else {
                  throw new Error(`PUT Error: ${uploadRes.status}`);
                }
              }
            } catch (err: any) {
              retryCount++;
              console.warn(`[Chat] Attempt ${retryCount} failed for ${file.name}:`, err.message);
              if (retryCount < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, retryCount * 2000));
              }
            }
          }
        }
      }

      const mk = generateMarkdownPayload(content);
      await socketRef.current.sendDM(
        channelIdRef.current,
        { t: content, mk: mk },
        finalAttachments
      );
    } catch (err) {
      console.error('[Chat] Send error:', err);
    } finally {
      setIsUploading(false);
      isMessageSendingRef.current = false;
    }
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0 || !lightClient || !socketRef.current || !channelIdRef.current) return;

    const validFiles: File[] = [];
    const newPreviews: { url: string; file: File }[] = [];

    files.forEach(file => {
      if (file.size > MAX_FILE_SIZE) {
        alert(`File ${file.name} is too large. Max is 100MB`);
        return;
      }
      validFiles.push(file);
      const url = file.type.startsWith('image/') ? URL.createObjectURL(file) : '';
      newPreviews.push({ url, file });
    });

    setSelectedFiles(prev => [...prev, ...validFiles]);
    setPreviews(prev => [...prev, ...newPreviews]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    const removedPreview = previews[index];
    if (removedPreview.url && removedPreview.url.startsWith('blob:')) {
      URL.revokeObjectURL(removedPreview.url);
    }
    setPreviews(prev => prev.filter((_, i) => i !== index));
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
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
    if (e.key === 'Enter' && !inputValue.trim() && selectedFiles.length === 0) {
      e.preventDefault();
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    }
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const files: File[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      // Handle image paste
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          files.push(file);
        }
      }

      // Handle file paste (from file explorer)
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file && !file.type.startsWith('image/')) {
          e.preventDefault();
          files.push(file);
        }
      }
    }

    if (files.length > 0) {
      const validFiles: File[] = [];
      const newPreviews: { url: string; file: File }[] = [];

      files.forEach(file => {
        if (file.size > MAX_FILE_SIZE) {
          alert(`File ${file.name} is too large. Max is 100MB`);
          return;
        }
        validFiles.push(file);
        const url = file.type.startsWith('image/') ? URL.createObjectURL(file) : '';
        newPreviews.push({ url, file });
      });

      setSelectedFiles(prev => [...prev, ...validFiles]);
      setPreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    const validFiles: File[] = [];
    const newPreviews: { url: string; file: File }[] = [];

    files.forEach(file => {
      if (file.size > MAX_FILE_SIZE) {
        alert(`File ${file.name} is too large. Max is 100MB`);
        return;
      }
      validFiles.push(file);
      const url = file.type.startsWith('image/') ? URL.createObjectURL(file) : '';
      newPreviews.push({ url, file });
    });

    setSelectedFiles(prev => [...prev, ...validFiles]);
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const handleDragOver = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    e.stopPropagation();
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
          {/* Security Alert */}
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

          {/* Messages */}
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
                    <div className="flex w-fit max-w-full flex-col gap-2">
                      {msg.content.t && (
                        <div
                          className={cn(
                            'overflow-wrap-anywhere w-fit max-w-full rounded-2xl px-3 py-2 text-sm break-words whitespace-pre-wrap shadow-sm transition-colors',
                            isMe
                              ? 'bg-brand-primary text-white'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
                            isMe ? (isFirstInGroup ? 'rounded-tr-none' : '') : isFirstInGroup ? 'rounded-tl-none' : ''
                          )}
                        >
                          {msg.content.t}
                        </div>
                      )}

                      {/* Attachments - Separated like Mezon */}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="flex flex-col gap-2">
                          {msg.attachments.map((at: any, i: number) => {
                            const filetype = at.filetype || at.file_type || '';
                            const isImage = filetype.startsWith('image/');

                            return (
                              <div key={i}>
                                {isImage ? (
                                  <div
                                    className="cursor-pointer overflow-hidden rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900"
                                    onClick={() => window.open(at.url, '_blank')}
                                  >
                                    <img
                                      src={at.url}
                                      alt={at.filename}
                                      className="max-h-80 w-auto object-contain"
                                    />
                                  </div>
                                ) : (
                                  <a
                                    href={at.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={cn(
                                      "flex items-start gap-3 rounded-xl border p-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-900",
                                      isMe
                                        ? "border-white/20 bg-white/10"
                                        : "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900"
                                    )}
                                  >
                                    <div className="shrink-0 pt-0.5">
                                      {getFileIcon(at.filename, filetype)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className={cn(
                                        "break-words text-sm font-medium",
                                        isMe ? "text-white" : "text-blue-600 dark:text-blue-400"
                                      )}>
                                        {at.filename}
                                      </div>
                                      <div className={cn(
                                        "mt-0.5 text-xs",
                                        isMe ? "text-white/70" : "text-gray-500 dark:text-gray-400"
                                      )}>
                                        size: {formatFileSize(at.size || 0)}
                                      </div>
                                    </div>
                                  </a>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Embed content */}
                      {msg.content.embed && msg.content.embed.length > 0 && (
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

          {previews.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2 pb-2">
              {previews.map((p, i) => (
                <div key={i} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
                  {p.file.type.startsWith('image/') ? (
                    <img src={p.url} alt={p.file.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-1">
                      {getFileIcon(p.file.name, p.file.type)}
                      <span className="text-[9px] font-bold text-gray-600 dark:text-gray-400">
                        {p.file.name.split('.').pop()?.toUpperCase()}
                      </span>
                    </div>
                  )}
                  <button
                    onClick={() => removeFile(i)}
                    className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow-md hover:bg-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleSendMessage} className="relative w-full">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              multiple
              accept="image/*,.pdf,.doc,.docx,.json,.txt"
            />
            <Textarea
              ref={textareaRef}
              rows={1}
              value={inputValue}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              placeholder="Type a message, paste or drag files..."
              className={cn(
                'max-h-50 min-h-10.5 w-full resize-none shadow-none',
                'bg-gray-50 dark:bg-gray-900',
                'border-gray-200 dark:border-gray-700',
                showLimitWarning ? 'border-red-300 focus:border-red-500' : 'focus:border-brand-primary',
                'focus:border-brand-primary focus:ring-0 focus-visible:ring-0',
                'text-sm text-gray-900 dark:text-white',
                'py-2.5 pr-24 pl-4',
                'overflow-y-auto break-words whitespace-pre-wrap'
              )}
            />
            <div className="absolute right-2 bottom-1.5 flex items-center gap-1">
              <Button
                type="button"
                disabled={isUploading}
                onClick={handleFileClick}
                variant="ghost"
                size="icon"
                className={cn(
                  'h-auto w-auto p-1.5',
                  'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800',
                  'disabled:opacity-50'
                )}
              >
                {isUploading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Paperclip className="h-5 w-5" />
                )}
              </Button>
              <Button
                type="submit"
                disabled={!inputValue.trim() && selectedFiles.length === 0}
                variant="ghost"
                size="icon"
                className={cn(
                  'h-auto w-auto p-1.5',
                  'text-brand-primary hover:bg-brand-primary/10',
                  'disabled:text-gray-400 dark:disabled:text-gray-600'
                )}
              >
                {isConnected ? <Send className="h-5 w-5" /> : <Loader2 className="h-5 w-5 animate-spin" />}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};