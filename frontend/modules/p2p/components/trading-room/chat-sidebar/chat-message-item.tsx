import { cn } from '@/lib/utils';
import { DateTimeUtil } from '@/utils';
import { MessageWithParsedContent } from '../../../types';
import { formatChatTime, isSameDay } from '../../../util';
import { MessageAttachment } from './message-attachment';

const getTimestamp = (message?: MessageWithParsedContent) =>
  message?.create_time_seconds ?? Math.floor(Date.now() / 1000);

interface SenderAvatarProps {
  avatar?: string;
  displayName?: string;
}

const SenderAvatar = ({ avatar, displayName }: SenderAvatarProps) =>
  avatar ? (
    <img src={avatar} alt="avatar" className="h-8 w-8 rounded-full border border-gray-100 object-cover" />
  ) : (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-[10px] font-bold text-gray-600 uppercase">
      {(displayName || 'U').charAt(0)}
    </div>
  );

interface ChatMessageItemProps {
  message: MessageWithParsedContent;
  prevMessage?: MessageWithParsedContent;
  nextMessage?: MessageWithParsedContent;
  currentUserId?: string;
}

export const ChatMessageItem = ({ message, prevMessage, nextMessage, currentUserId }: ChatMessageItemProps) => {
  const isMe = message.sender_id === currentUserId || message.sender_id === 'me';
  const msgTimestamp = getTimestamp(message);
  const prevTimestamp = getTimestamp(prevMessage);
  const nextTimestamp = getTimestamp(nextMessage);
  const showDateDivider = !prevMessage || !isSameDay(msgTimestamp, prevTimestamp);
  const isFirstInGroup = !prevMessage || prevMessage.sender_id !== message.sender_id || showDateDivider;
  const isLastInGroup =
    !nextMessage || nextMessage.sender_id !== message.sender_id || !isSameDay(msgTimestamp, nextTimestamp);

  return (
    <div>
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
            className={cn('mb-1 px-1 text-[10px] font-bold tracking-tight text-gray-400 uppercase', !isMe && 'ml-10')}
          >
            {message.display_name} {isMe && '(You)'}
          </span>
        )}
        <div className={cn('flex w-full items-end gap-2', isMe ? 'flex-row-reverse' : 'flex-row')}>
          {!isMe && (
            <div className="w-8 shrink-0">
              {isLastInGroup ? (
                <SenderAvatar avatar={message.avatar} displayName={message.display_name} />
              ) : (
                <div className="w-8" />
              )}
            </div>
          )}
          <div className="flex w-fit max-w-full flex-col gap-2">
            {message.content.t && (
              <div
                className={cn(
                  'overflow-wrap-anywhere w-fit max-w-full rounded-2xl px-3 py-2 text-sm break-words whitespace-pre-wrap shadow-sm transition-colors',
                  isMe
                    ? 'bg-brand-primary text-white'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
                  isFirstInGroup && (isMe ? 'rounded-tr-none' : 'rounded-tl-none')
                )}
              >
                {message.content.t}
              </div>
            )}

            {message.attachments && message.attachments.length > 0 && (
              <div className="flex flex-col gap-2">
                {message.attachments.map((attachment, i) => (
                  <div key={i}>
                    <MessageAttachment attachment={attachment} isMe={isMe} />
                  </div>
                ))}
              </div>
            )}

            {message.content.embed && message.content.embed.length > 0 && (
              <div className="flex flex-col rounded-md border border-black/5 bg-black/5 p-3 dark:border-white/10 dark:bg-white/5">
                {message.content.embed[0].fields && (
                  <div className="grid grid-cols-1 gap-1 text-xs opacity-90">
                    {message.content.embed[0].fields.map((field, i) => (
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
};
