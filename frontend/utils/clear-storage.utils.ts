import { STORAGE_KEYS } from '@/constant';
export const AUTH_STORAGE_KEYS: readonly string[] = [
  STORAGE_KEYS.TOKEN,
  STORAGE_KEYS.AUTH_TOKEN,
  STORAGE_KEYS.USER_INFO,
  STORAGE_KEYS.KEY_PAIR,
  STORAGE_KEYS.ZK_PROOF,
] as const;

export function clearAuthStorage(): void {
  const keysToClear = new Set<string>([...AUTH_STORAGE_KEYS]);
  for (const key of keysToClear) {
    localStorage.removeItem(key);
  }
}

export function removeStorageKeys(keys: string | string[]): void {
  const list = Array.isArray(keys) ? keys : [keys];
  for (const key of list) {
    localStorage.removeItem(key);
  }
}
