import { getMessagesByChannel, findChannelByUsersQuery } from "../database/index.js";
import type { MessageWithParsedContent, ChatHistoryRow } from "../types.js";

export const getChatHistory = (channelId: string): MessageWithParsedContent[] => {
  const rows = getMessagesByChannel(channelId);
  return rows.map((row: ChatHistoryRow) => ({
    id: row.id,
    message_id: row.id,
    channel_id: row.channel_id,
    channel_label: "",
    code: 0,
    clan_id: row.clan_id,
    sender_id: row.sender_id,
    content: JSON.parse(row.content || "{}"),
    mentions: JSON.parse(row.mentions || "[]"),
    attachments: JSON.parse(row.attachments || "[]"),
    reactions: JSON.parse(row.reactions || "[]"),
    msg_references: JSON.parse(row.msg_references || "[]"),
    topic_id: row.topic_id,
    create_time: String(row.create_time_seconds),
    create_time_seconds: row.create_time_seconds,
  }));
};

export const findChannelByUsers = (userIds: string[]): string | null => {
  return findChannelByUsersQuery(userIds);
};
