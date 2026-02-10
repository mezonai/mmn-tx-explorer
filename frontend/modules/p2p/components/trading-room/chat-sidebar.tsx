'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, AlertTriangle, Loader2, MessageCircle, X, Info, AlertCircle, Paperclip } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLightClient, useUser } from '@/providers';
import { LightSocket } from 'mezon-light-sdk';
import { STORAGE_KEYS } from '@/constant';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { formatChatTime, generateMarkdownPayload, isSameDay } from '../../util';
import { AutoMessagePayload, MessageWithParsedContent, ParsedMessageContent, ChannelMessage } from '../../types';
import { DateTimeUtil, formatFileSize, getFileIcon, getFilesFromClipboard, getFilesFromDragEvent, normalizeFilename, getSafeFileType } from '@/utils';
import { safeJsonParse } from '@/utils/json-parse.utils';
import { toast } from 'sonner';
import { MAX_CHAR_LIMIT, MAX_FILE_SIZE } from '../../constants';
import Bottleneck from 'bottleneck';

// Initialize a limiter for the upload attachment API
const uploadLimiter = new Bottleneck({
  minTime: 1100, // Ensuring at least 1.1s between requests (server limit is usually 1s)
  maxConcurrent: 1, // Process one at a time for safety
});

interface ChatSidebarProps {
  sellerId: string;
  autoMessage?: AutoMessagePayload | null;
  onAutoMessageSent?: () => void;
}

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<{ url: string; file: File }[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const isMobileOpenRef = useRef(isMobileOpen);
  const isMessageSendingRef = useRef(false);

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
    const unsubs: (() => void)[] = [];

    const initChat = async () => {
      try {
        const isExpired = await lightClient.isSessionExpired();
        if (isExpired) {
          await lightClient.refreshSession();
          localStorage.setItem(STORAGE_KEYS.LIGHT_CLIENT, JSON.stringify(lightClient.exportSession()));
        }
        if (!isMounted) return;

        const sdk = lightClient;
        const socket = new LightSocket(sdk, sdk.session);

        await socket.connect({
          onError: (error) => console.error('[Chat] Socket error:', error),
          verbose: false
        });

        socketRef.current = socket;

        const channel = await sdk.createDM(sellerId);
        await socket.joinDMChannel(channel.channel_id!);
        channelIdRef.current = channel.channel_id!;

        const unsubscribe = socket.onChannelMessage((msg: ChannelMessage) => {
          let parsedContent: ParsedMessageContent = { t: '' };
          if (typeof msg.content === 'string') {
            parsedContent = safeJsonParse(msg.content) ?? { t: msg.content };
          } else if (msg.content && typeof msg.content === 'object') {
            parsedContent = msg.content as ParsedMessageContent;
          }

          const hasContent = parsedContent && parsedContent.t && parsedContent.t.trim() !== '';
          const hasAttachments = msg.attachments && msg.attachments.length > 0;
          if (!hasContent && !hasAttachments) return;

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
        unsubs.push(unsubscribe);

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
      unsubs.forEach(unsub => unsub());
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [lightClient, sellerId, user?.id]);

  useEffect(() => {
    if (autoMessage && isConnected && socketRef.current && channelIdRef.current) {
      const sendAuto = async () => {
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

      sendAuto();
    }
  }, [autoMessage, isConnected, onAutoMessageSent]);

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

    if (isMessageSendingRef.current || (!hasContent && !hasAttachments) || !socketRef.current || !channelIdRef.current || !lightClient) {
      return;
    }

    isMessageSendingRef.current = true;
    setIsUploading(true);

    // Save current state for recovery if needed
    const filesToUpload = [...selectedFiles];
    const currentPreviews = [...previews];

    // Optimistically clear UI
    setInputValue('');
    setPreviews([]);
    setSelectedFiles([]);
    setShowLimitWarning(false);

    try {
      // Sequential upload with rate limiting (using Bottleneck)
      const finalAttachments = [];

      for (const file of filesToUpload) {
        if (file.size > MAX_FILE_SIZE) {
          toast.error(`File ${file.name} is too large. Max is ${MAX_FILE_SIZE / 1024 / 1024}MB`);
          continue;
        }

        let retryCount = 0;
        const maxRetries = 3;
        let uploadedFile = null;

        while (retryCount < maxRetries) {
          try {
            const safeName = normalizeFilename(file.name);
            const safeType = getSafeFileType(file);
            const uniqueName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${safeName}`;

            // Use the limiter to schedule the uploadAttachment call
            const response = await uploadLimiter.schedule(() =>
              lightClient.uploadAttachment({
                filename: uniqueName,
                filetype: safeType,
                size: file.size,
              })
            );

            if (response?.url) {
              const uploadRes = await fetch(response.url, {
                method: 'PUT',
                headers: { 'Content-Type': safeType },
                body: file,
              });

              if (uploadRes.ok) {
                const urlObj = new URL(response.url);
                const cdnUrl = `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;

                uploadedFile = {
                  filename: file.name,
                  url: cdnUrl,
                  size: file.size,
                  filetype: safeType,
                };
                break; // Success
              } else {
                throw new Error(`PUT Error: ${uploadRes.status}`);
              }
            }
          } catch (err: any) {
            retryCount++;
            console.warn(`[Chat] Attempt ${retryCount} failed for ${file.name}:`, err.message);
            // If it's a rate limit error (403), wait longer before retrying
            const backoff = err.message?.includes('403') || err.message?.includes('Limit exceeded') ? 2000 : 1000;
            await new Promise(resolve => setTimeout(resolve, retryCount * backoff));
          }
        }

        if (uploadedFile) {
          finalAttachments.push(uploadedFile);
        }
      }

      const mk = generateMarkdownPayload(content);
      await socketRef.current.sendDM({
        channelId: channelIdRef.current,
        content: {
          t: content,
          mk: mk
        },
        attachments: finalAttachments
      });

      if (hasAttachments && finalAttachments.length < filesToUpload.length) {
        toast.warning(`Some files could not be uploaded (${filesToUpload.length - finalAttachments.length} failed)`);
      }

      // Revoke blobs only after successful message delivery
      currentPreviews.forEach(p => {
        if (p.url && p.url.startsWith('blob:')) URL.revokeObjectURL(p.url);
      });

    } catch (err) {
      toast.error('Failed to send message. Please check your connection and try again.');
      // Recovery: Restore input and selected files so user doesn't lose data
      setInputValue(content);
      setPreviews(currentPreviews);
      setSelectedFiles(filesToUpload);
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
        toast.error(`File ${file.name} is too large. Max is ${MAX_FILE_SIZE / 1024 / 1024}MB`);
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
    const files = getFilesFromClipboard(e);
    if (files.length === 0) return;
    e.preventDefault();


    if (files.length > 0) {
      const validFiles: File[] = [];
      const newPreviews: { url: string; file: File }[] = [];

      files.forEach(file => {
        if (file.size > MAX_FILE_SIZE) {
          toast.error(`File ${file.name} is too large. Max is ${MAX_FILE_SIZE / 1024 / 1024}MB`);
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

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = getFilesFromDragEvent(e);
    if (files.length === 0) return;


    const validFiles: File[] = [];
    const newPreviews: { url: string; file: File }[] = [];

    files.forEach(file => {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`File ${file.name} is too large. Max is ${MAX_FILE_SIZE / 1024 / 1024}MB`);
        return;
      }
      validFiles.push(file);
      const url = file.type.startsWith('image/') ? URL.createObjectURL(file) : '';
      newPreviews.push({ url, file });
    });

    setSelectedFiles(prev => [...prev, ...validFiles]);
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const rect = e.currentTarget.getBoundingClientRect();
    if (
      e.clientX <= rect.left ||
      e.clientX >= rect.right ||
      e.clientY <= rect.top ||
      e.clientY >= rect.bottom
    ) {
      setIsDragging(false);
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
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        className={cn(
          'fixed inset-0 z-50 flex h-full flex-col bg-white transition-transform duration-300 md:sticky md:top-24 md:z-0 md:flex md:h-[calc(100vh-140px)] md:w-87.5 md:translate-y-0 lg:w-125 dark:bg-black dark:md:border-gray-800',
          isMobileOpen ? 'translate-y-0' : 'translate-y-full md:translate-y-0'
        )}
      >
        {isDragging && (
          <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center gap-4 bg-brand-primary/10 backdrop-blur-[2px] border-2 border-dashed border-brand-primary m-2 rounded-xl transition-all animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center gap-2 text-brand-primary">
              <Paperclip className="h-12 w-12 animate-bounce" />
              <p className="text-lg font-bold">Drop files here</p>
              <p className="text-xs opacity-70">max {MAX_FILE_SIZE / 1024 / 1024} MB</p>
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

                      {/* Attachments rendering */}
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
              placeholder="Type a message, paste or drag files..."
              className={cn(
                'max-h-50 min-h-10.5 w-full resize-none shadow-none',
                'bg-gray-50 dark:bg-gray-900',
                'border-gray-200 dark:border-gray-700',
                showLimitWarning ? 'border-red-300 focus:border-red-500' : 'focus:border-brand-primary',
                'focus:border-brand-primary focus:ring-0 focus-visible:ring-0',
                'text-sm text-gray-900 dark:text-white',
                'py-2.5 pr-24 pl-4',
                'overflow-y-auto break-words whitespace-pre-wrap',
                '[&::-webkit-scrollbar]:w-1.5',
                '[&::-webkit-scrollbar-track]:bg-transparent',
                '[&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-gray-800',
                'hover:[&::-webkit-scrollbar-thumb]:bg-gray-400 dark:hover:[&::-webkit-scrollbar-thumb]:bg-gray-700',
                '[&::-webkit-scrollbar-thumb]:rounded-full'
              )}
            />
            <div className="absolute right-5 bottom-1.5 z-10 flex items-center gap-1">
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