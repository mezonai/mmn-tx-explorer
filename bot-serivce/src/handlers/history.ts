import type { Request, Response } from "express";
import { getChatHistory } from "../services/chat.service.js";

export const historyHandler = (req: Request, res: Response) => {
  const { channelId } = req.params;
  const { limit, before } = req.query;

  if (!channelId) {
    return res.status(400).json({ error: "Missing channelId" });
  }

  const limitNum = Math.min(limit ? parseInt(limit as string) : 50, 200);
  const beforeNum = before ? parseInt(before as string) : undefined;

  try {
    const messages = getChatHistory(channelId as string, limitNum, beforeNum);
    res.json(messages);
  } catch (err) {
    console.error("Failed to handle history request:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
