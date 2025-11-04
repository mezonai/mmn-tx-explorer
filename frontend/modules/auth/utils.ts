import { STORAGE_KEYS } from '@/constant';
import { EZkClientType, MmnClient, ZkClient } from 'mmn-client-js';
import { LoginResponse, StateObject } from './type';

const mmnURL = process.env.NEXT_PUBLIC_CHAT_APP_MMN_API_URL ?? '';
const zkURL = process.env.NEXT_PUBLIC_CHAT_APP_ZK_API_URL ?? '';
export const mmnClient = new MmnClient({
  baseUrl: mmnURL,
});
export const zkClient = new ZkClient({
  endpoint: zkURL,
  timeout: 30000,
});
export const handleTokenStorage = (userInfo: LoginResponse) => {
  const token = {
    access_token: userInfo.access_token,
    refresh_token: userInfo.refresh_token,
  };
  localStorage.setItem(STORAGE_KEYS.TOKEN, JSON.stringify(token));
  localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, userInfo.auth_token);
};

export const generateAndStoreKeyPair = () => {
  const keypair = mmnClient.generateEphemeralKeyPair();
  localStorage.setItem(STORAGE_KEYS.KEY_PAIR, JSON.stringify(keypair));
  return keypair;
};

export const processAndStoreUser = (userInfo: LoginResponse['user'], senderAddress: string) => {
  const userObj = {
    id: userInfo.user_id || userInfo.sub,
    username: userInfo.username || userInfo.display_name || '',
    email: userInfo.email,
    avatar: userInfo.avatar,
    walletAddress: senderAddress,
  };
  localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(userObj));
  return userObj;
};

export const fetchAndStoreZkProof = async (
  userId: string,
  ephemeralPublicKey: string,
  jwt: string,
  address: string
) => {
  try {
    const zkProof = await zkClient.getZkProofs({
      userId,
      ephemeralPublicKey,
      jwt,
      address,
      clientType: EZkClientType.OAUTH,
    });
    localStorage.setItem(STORAGE_KEYS.ZK_PROOF, JSON.stringify(zkProof));
    return zkProof;
  } catch (error) {
    console.error('Error fetching ZK proofs', error);
  }
};
export function encodeState(stateObject: StateObject): string {
  const jsonString = JSON.stringify(stateObject);
  const base64String = btoa(jsonString);
  return base64String.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export function decodeState(encodedState: string): StateObject {
  try {
    let base64String = encodedState.replace(/-/g, '+').replace(/_/g, '/');
    while (base64String.length % 4) {
      base64String += '=';
    }
    const jsonString = atob(base64String);
    const decodedObject = JSON.parse(jsonString);
    if (!decodedObject || typeof decodedObject.csrf !== 'string' || typeof decodedObject.redirect_uri !== 'string') {
      throw new Error('Invalid state object after decoding.');
    }
    return decodedObject;
  } catch (error) {
    console.error('Error decoding state:', error);
    throw new Error('Invalid or corrupted state string.');
  }
}
export function generateCsrfToken(length = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
