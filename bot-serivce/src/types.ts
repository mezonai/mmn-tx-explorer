import type { ChannelMessage } from "mezon-sdk";

export interface MessageWithParsedContent extends Omit<ChannelMessage, 'content'> {
  content: any;
}

export interface ChatHistoryRow {
  id: string;
  channel_id: string;
  clan_id: string;
  sender_id: string;
  content: string;
  mentions: string;
  attachments: string;
  reactions: string;
  msg_references: string;
  topic_id: string;
  create_time_seconds: number;
}
