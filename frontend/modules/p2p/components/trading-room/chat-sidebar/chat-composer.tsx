import React, { useRef, useState } from 'react';
import Bottleneck from 'bottleneck';
import { AlertCircle, Loader2, Paperclip, Send } from 'lucide-react';
import { LightClient, LightSocket } from 'mezon-light-sdk';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useLightClient } from '@/providers';
import { getFilesFromClipboard, uploadAttachmentFile } from '@/utils';
import { MAX_CHAR_LIMIT, MAX_FILE_SIZE } from '../../../constants';
import { generateMarkdownPayload } from '../../../util';
import { AttachmentPreviewList } from './attachment-preview-list';
import { ChatAttachments } from './useChatAttachments';
import { notifyFileTooLarge, revokePreviewUrl } from './utils';

// Initialize a limiter for the upload attachment API
const uploadLimiter = new Bottleneck({
  minTime: 1100, // Ensuring at least 1.1s between requests (server limit is usually 1s)
  maxConcurrent: 1, // Process one at a time for safety
});

const MAX_UPLOAD_RETRIES = 3;
const TEXTAREA_MAX_HEIGHT = 150;

const uploadFileWithRetry = async (lightClient: LightClient, file: File) => {
  let retryCount = 0;

  while (retryCount < MAX_UPLOAD_RETRIES) {
    try {
      const result = await uploadAttachmentFile(lightClient, file, uploadLimiter);
      if (result) return result;
    } catch (err) {
      retryCount++;
      console.warn(`[Chat] Attempt ${retryCount} failed for ${file.name}:`, (err as Error).message);
    }
  }

  return null;
};

interface ChatComposerProps {
  socketRef: React.RefObject<LightSocket | null>;
  channelIdRef: React.RefObject<string | null>;
  isConnected: boolean;
  attachments: ChatAttachments;
}

export const ChatComposer = ({ socketRef, channelIdRef, isConnected, attachments }: ChatComposerProps) => {
  const [inputValue, setInputValue] = useState('');
  const [showLimitWarning, setShowLimitWarning] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMessageSendingRef = useRef(false);

  const { lightClient } = useLightClient();
  const { selectedFiles, previews, addFiles, removeFile, clearFiles, restoreFiles } = attachments;

  const isMessageEmpty = !inputValue.trim() && selectedFiles.length === 0;

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const content = inputValue.trim();
    const hasContent = content.length > 0;
    const hasAttachments = selectedFiles.length > 0;

    if (
      isMessageSendingRef.current ||
      (!hasContent && !hasAttachments) ||
      !socketRef.current ||
      !channelIdRef.current ||
      !lightClient
    ) {
      return;
    }

    isMessageSendingRef.current = true;
    setIsUploading(true);

    // Save current state for recovery if needed
    const filesToUpload = [...selectedFiles];
    const currentPreviews = [...previews];

    // Optimistically clear UI
    setInputValue('');
    clearFiles();
    setShowLimitWarning(false);

    try {
      // Sequential upload with rate limiting (using Bottleneck)
      const finalAttachments = [];

      for (const file of filesToUpload) {
        if (file.size > MAX_FILE_SIZE) {
          notifyFileTooLarge(file);
          continue;
        }

        const uploadedFile = await uploadFileWithRetry(lightClient, file);
        if (uploadedFile) {
          finalAttachments.push(uploadedFile);
        }
      }

      const mk = generateMarkdownPayload(content);
      await socketRef.current.sendDM({
        channelId: channelIdRef.current,
        content: {
          t: content,
          mk: mk,
        },
        attachments: finalAttachments,
      });

      if (hasAttachments && finalAttachments.length < filesToUpload.length) {
        toast.warning(`Some files could not be uploaded (${filesToUpload.length - finalAttachments.length} failed)`);
      }

      // Revoke blobs only after successful message delivery
      currentPreviews.forEach(revokePreviewUrl);
    } catch {
      toast.error('Failed to send message. Please check your connection and try again.');
      // Recovery: Restore input and selected files so user doesn't lose data
      setInputValue(content);
      restoreFiles(filesToUpload, currentPreviews);
    } finally {
      setIsUploading(false);
      isMessageSendingRef.current = false;
    }
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0 || !lightClient || !socketRef.current || !channelIdRef.current) return;

    addFiles(files);
    if (fileInputRef.current) fileInputRef.current.value = '';
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
    target.style.height = `${Math.min(target.scrollHeight, TEXTAREA_MAX_HEIGHT)}px`;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && isMessageEmpty) {
      e.preventDefault();
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const files = getFilesFromClipboard(e);
    if (files.length === 0) return;
    e.preventDefault();

    addFiles(files);
  };

  return (
    <div className="shrink-0 border-t border-gray-200 bg-white p-4 pb-8 md:pb-4 dark:border-gray-800 dark:bg-black">
      {showLimitWarning && (
        <div className="animate-in fade-in slide-in-from-bottom-1 mb-2 flex items-center gap-2 rounded-md bg-red-50 p-2 text-xs text-red-600 dark:bg-red-900/20 dark:text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>Message limit reached. Maximum {MAX_CHAR_LIMIT} characters allowed.</span>
        </div>
      )}

      {previews.length > 0 && <AttachmentPreviewList previews={previews} onRemove={removeFile} />}

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
            {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Paperclip className="h-5 w-5" />}
          </Button>
          <Button
            type="submit"
            disabled={isMessageEmpty}
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
  );
};
