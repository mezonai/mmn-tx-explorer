import type { Request, Response } from "express";
import { findChannelByUsers } from "../services/chat.service.js";

export const channelHandler = (req: Request, res: Response) => {
  const { userIds } = req.query;
  const offerCreatorId =
    typeof req.query.offerCreatorId === "string" ? req.query.offerCreatorId : null;
  const orderCreatorId =
    typeof req.query.orderCreatorId === "string" ? req.query.orderCreatorId : null;

  let idList: string[] = [];
  if (offerCreatorId && orderCreatorId) {
    idList = [offerCreatorId, orderCreatorId];
  } else {
    if (!userIds || typeof userIds !== "string") {
      return res.status(400).json({
        error: "Missing userIds or (offerCreatorId, orderCreatorId) query parameters",
      });
    }
    idList = userIds.split(",");
  }

  idList = Array.from(new Set(idList.filter(Boolean)));
  if (idList.length === 0) {
    return res.status(400).json({ error: "Empty user id list" });
  }

  try {
    const channelId = findChannelByUsers(idList);
    res.json({ channelId });
  } catch (err) {
    console.error("Failed to handle channel discovery request:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
