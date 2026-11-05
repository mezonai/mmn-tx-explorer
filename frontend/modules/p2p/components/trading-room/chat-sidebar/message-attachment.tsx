import { cn } from '@/lib/utils';
import { downloadFile, formatFileSize } from '@/utils';
import { MessageWithParsedContent } from '../../../types';
import { FileTypeIcon } from './file-type-icon';

// Some payloads carry the MIME type as `file_type` instead of `filetype`
type MessageAttachmentData = NonNullable<MessageWithParsedContent['attachments']>[number] & {
  file_type?: string;
};

interface MessageAttachmentProps {
  attachment: MessageAttachmentData;
  isMe: boolean;
}

export const MessageAttachment = ({ attachment, isMe }: MessageAttachmentProps) => {
  const filetype = attachment.filetype || attachment.file_type || '';
  const isImage = filetype.startsWith('image/');

  if (isImage) {
    return (
      <div
        className="cursor-pointer overflow-hidden rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900"
        onClick={() => window.open(attachment.url, '_blank')}
      >
        <img src={attachment.url} alt={attachment.filename} className="max-h-80 w-auto object-contain" />
      </div>
    );
  }

  return (
    <div
      onClick={() => downloadFile(attachment.url!, attachment.filename || 'file')}
      className={cn(
        'flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-900',
        isMe ? 'border-white/20 bg-white/10' : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900'
      )}
    >
      <div className="shrink-0 pt-0.5">
        <FileTypeIcon filename={attachment.filename!} filetype={filetype} />
      </div>
      <div className="min-w-0 flex-1">
        <div
          className={cn('text-sm font-medium break-words', isMe ? 'text-white' : 'text-blue-600 dark:text-blue-400')}
        >
          {attachment.filename}
        </div>
        <div className={cn('mt-0.5 text-xs', isMe ? 'text-white/70' : 'text-gray-500 dark:text-gray-400')}>
          size: {formatFileSize(attachment.size || 0)}
        </div>
      </div>
    </div>
  );
};
