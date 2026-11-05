import { useEffect, useRef, useState } from 'react';
import { LightSocket } from 'mezon-light-sdk';

import { STORAGE_KEYS } from '@/constant';
import { useLightClient, useUser } from '@/providers';
import { safeJsonParse } from '@/utils/json-parse.utils';
import {
  AutoMessagePayload,
  ChannelMessage,
  MessageCode,
  MessageWithParsedContent,
  ParsedMessageContent,
} from '../../../types';
import { generateMarkdownPayload } from '../../../util';

const parseMessageContent = (content: ChannelMessage['content']): ParsedMessageContent => {
  let parsedContent: ParsedMessageContent = { t: '' };
  if (typeof content === 'string') {
    parsedContent = safeJsonParse(content) ?? { t: content };
  } else if (content && typeof content === 'object') {
    parsedContent = content as ParsedMessageContent;
  }
  return parsedContent;
};

interface UseTradingChatParams {
  sellerId: string;
  autoMessage?: AutoMessagePayload | null;
  onAutoMessageSent?: () => void;
  isMobileOpen: boolean;
}

export const useTradingChat = ({ sellerId, autoMessage, onAutoMessageSent, isMobileOpen }: UseTradingChatParams) => {
  const [messages, setMessages] = useState<MessageWithParsedContent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const socketRef = useRef<LightSocket | null>(null);
  const channelIdRef = useRef<string | null>(null);
  const autoMessageSentRef = useRef<AutoMessagePayload | null>(null);
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
          verbose: false,
        });

        socketRef.current = socket;

        const channel = await sdk.createDM(sellerId);
        await socket.joinDMChannel(channel.channel_id!);
        channelIdRef.current = channel.channel_id!;

        const unsubscribe = socket.onChannelMessage((msg: ChannelMessage) => {
          const parsedContent = parseMessageContent(msg.content);

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
      unsubs.forEach((unsub) => unsub());
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [lightClient, sellerId, user?.id]);

  useEffect(() => {
    if (autoMessage && isConnected && socketRef.current && channelIdRef.current) {
      if (autoMessageSentRef.current === autoMessage) return;
      autoMessageSentRef.current = autoMessage;
      const sendAuto = async () => {
        try {
          const mk = generateMarkdownPayload(autoMessage.text);

          await socketRef.current?.sendDM({
            channelId: channelIdRef.current!,
            content: {
              t: autoMessage.text,
              mk: mk,
              embed: autoMessage.embed,
              components: autoMessage.components,
            },
            code: autoMessage.buzz ? MessageCode.BUZZ : MessageCode.NORMAL,
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

  return { messages, isConnected, unreadCount, socketRef, channelIdRef };
};
