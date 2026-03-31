import type { MezonClient } from "mezon-sdk";

export const registerEvents = (client: MezonClient) => {
  client.on("user_channel_added_event", (event: any) => {});
};
