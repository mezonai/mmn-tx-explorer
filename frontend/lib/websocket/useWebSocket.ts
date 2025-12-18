'use client';

import { useEffect, useRef } from 'react';
import { getWebSocketManager } from './websocket-manager';
import { STORAGE_KEYS } from '@/constant';
import { safeJsonParse } from '@/utils';
import { AuthenticationService } from '@/modules/auth';

/**
 * Hook to initialize and manage WebSocket connection
 * Automatically connects when user is authenticated
 */
export const useWebSocket = () => {
  const wsManagerRef = useRef(getWebSocketManager());
  const isInitializedRef = useRef(false);
  const refreshRetryRef = useRef(0);

  useEffect(() => {
    // Get latest token, automatically refresh if needed (similar to interceptor)
    const getLatestToken = async (): Promise<string | null> => {
      try {
        const tokenData = safeJsonParse<{ access_token?: string; refresh_token?: string }>(
          localStorage.getItem(STORAGE_KEYS.TOKEN)
        );

        if (!tokenData?.access_token) {
          return null;
        }

        // If refresh_token exists, try to refresh to ensure token is still valid
        // Similar to interceptor logic, only retry once to avoid loop
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
    if (!isInitializedRef.current) {
      wsManagerRef.current.setTokenExpiredHandler(getLatestToken);
      isInitializedRef.current = true;
    }

    // Connect if token exists
    // websocket-manager.connect() will handle race condition by checking:
    // - If already connected with same token → do nothing
    // - If connected with different token → disconnect and reconnect with new token
    // - If not connected → connect normally
    const tokenData = safeJsonParse<{ access_token?: string }>(localStorage.getItem(STORAGE_KEYS.TOKEN));
    const accessToken = tokenData?.access_token;

    if (accessToken) {
      wsManagerRef.current.connect(accessToken);
    }

    // Cleanup on unmount (optional)
    // return () => {
    //   wsManagerRef.current.disconnect();
    // };
  }, []); // Empty dependency array to run only once

  return wsManagerRef.current;
};
