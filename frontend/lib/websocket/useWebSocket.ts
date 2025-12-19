'use client';

import { useEffect, useRef } from 'react';
import { getWebSocketManager } from './websocket-manager';
import { STORAGE_KEYS } from '@/constant';
import { safeJsonParse } from '@/utils';
import { AuthenticationService } from '@/modules/auth';

export const useWebSocket = () => {
  const wsManagerRef = useRef(getWebSocketManager());
  const isInitializedRef = useRef(false);
  const refreshRetryRef = useRef(0);

  useEffect(() => {
    // Get latest token, automatically refresh if needed (for reconnection scenarios)
    const getLatestToken = async (): Promise<string | null> => {
      try {
        const tokenData = safeJsonParse<{ access_token?: string; refresh_token?: string }>(
          localStorage.getItem(STORAGE_KEYS.TOKEN)
        );

        if (!tokenData?.access_token) {
          return null;
        }

        // If refresh_token exists, try to refresh to ensure token is still valid
        // Only retry once to avoid loop
        if (tokenData.refresh_token && refreshRetryRef.current < 1) {
          try {
            refreshRetryRef.current++;
            await AuthenticationService.refreshLogin(tokenData.refresh_token);
            refreshRetryRef.current = 0;

            // Get new token after refresh
            const refreshedTokenData = safeJsonParse<{ access_token?: string }>(
              localStorage.getItem(STORAGE_KEYS.TOKEN)
            );
            return refreshedTokenData?.access_token ?? null;
          } catch {
            refreshRetryRef.current = 0;
            // If refresh fails, still return old token to attempt connection
            // Server will return error if token is actually expired
            return tokenData.access_token;
          }
        }

        return tokenData.access_token;
      } catch {
        return null;
      }
    };

    // Setup token expired handler (only once)
    // This is used when WebSocket needs to reconnect due to token expiration
    if (!isInitializedRef.current) {
      wsManagerRef.current.setTokenExpiredHandler(getLatestToken);
      isInitializedRef.current = true;
    }

  }, []);

  return wsManagerRef.current;
};
