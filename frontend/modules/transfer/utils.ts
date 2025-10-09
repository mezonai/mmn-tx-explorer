import { MmnClient, ZkClient } from 'mmn-client-js';

const mmnURL = process.env.NEXT_PUBLIC_CHAT_APP_MMN_API_URL ?? '';
const zkURL = process.env.NEXT_PUBLIC_CHAT_APP_ZK_API_URL ?? '';

export const mmnClient = new MmnClient({
  baseUrl: mmnURL,
});

export const zkClient = new ZkClient({
    endpoint: zkURL,
    timeout: 30000,
});
