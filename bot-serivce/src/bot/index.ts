import { MezonClient } from "mezon-sdk";
import { registerEvents } from "./events.js";

export const initBot = async () => {
  const token = process.env.APPLICATION_TOKEN;
  const id = process.env.APPLICATION_ID;

  if (!token || !id) {
    throw new Error("APPLICATION_TOKEN or APPLICATION_ID is not defined in .env");
  }

  const client = new MezonClient({ botId: id as any, token: token as any });
  await client.login();

  registerEvents(client);

  return client;
};
