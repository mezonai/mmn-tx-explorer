import type { MezonClient} from "mezon-sdk";

export const registerEvents = (client: MezonClient) => {
  client.on("user_channel_added_event", (event: any) => {
    console.log(
      "Bot added to channel:",
      event?.channel_desc?.channel_id,
      "Type:",
      event?.channel_desc?.type,
    );
  });
};
