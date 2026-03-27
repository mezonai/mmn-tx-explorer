import type { Request, Response } from "express";
import { getChatHistory } from "../services/chat.service.js";

export const historyHandler = (req: Request, res: Response) => {
  const { channelId } = req.params;

  if (!channelId) {
    return res.status(400).json({ error: "Missing channelId" });
  }

  try {
    const messages = getChatHistory(channelId as string);
    res.json(messages);
  } catch (err) {
    console.error("Failed to handle history request:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
