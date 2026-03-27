import Database from "better-sqlite3";
import path from "path";
import type { ChatHistoryRow } from "../types.js";

const dbPath = path.resolve("mezon-cache/mezon-messages-cache.db");
const db = new Database(dbPath);

export const getMessagesByChannel = (channelId: string): ChatHistoryRow[] => {
  const query = `
    SELECT * FROM messages_v2 
    WHERE channel_id = ? 
    AND clan_id = '0' 
    ORDER BY create_time_seconds ASC
  `;
  return db.prepare(query).all(channelId) as ChatHistoryRow[];
};

export const findChannelByUsersQuery = (userIds: string[]): string | null => {
  const placeholders = userIds.map(() => "?").join(",");
  const query = `
    SELECT channel_id FROM messages_v2 
    WHERE clan_id = '0' 
    AND sender_id IN (${placeholders}) 
    GROUP BY channel_id 
    HAVING COUNT(DISTINCT sender_id) = ?
    ORDER BY MAX(create_time_seconds) DESC
    LIMIT 1
  `;
  const row = db.prepare(query).get(...userIds, userIds.length) as { channel_id: string } | undefined;
  return row?.channel_id || null;
};

