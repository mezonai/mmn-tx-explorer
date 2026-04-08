import { Router } from "express";
import { historyHandler } from "./handlers/history.js";
import { channelHandler } from "./handlers/channel.js";

const router = Router();

router.get("/history/:channelId", historyHandler);
router.get("/find-channel-by-users", channelHandler);

export default router;
