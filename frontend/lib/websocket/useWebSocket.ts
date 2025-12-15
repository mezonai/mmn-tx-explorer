'use client';

import { useEffect, useRef } from 'react';
import { getWebSocketManager } from './websocket-manager';
import { STORAGE_KEYS } from '@/constant';
import { safeJsonParse } from '@/utils';

/**
 * Hook to initialize and manage WebSocket connection
 * Automatically connects when user is authenticated
 */
export const useWebSocket = () => {
  const wsManagerRef = useRef(getWebSocketManager());
  const isInitializedRef = useRef(false);

  useEffect(() => {
    // Hàm lấy token mới từ localStorage
    const getLatestToken = async (): Promise<string | null> => {
      const tokenData = safeJsonParse<{ access_token?: string }>(
        localStorage.getItem(STORAGE_KEYS.TOKEN)
      );
      return tokenData?.access_token ?? null;
    };

    // Setup token expired handler
    if (!isInitializedRef.current) {
      wsManagerRef.current.setTokenExpiredHandler(getLatestToken);
    }

    // Get current token and connect
    const tokenData = safeJsonParse<{ access_token?: string }>(
      localStorage.getItem(STORAGE_KEYS.TOKEN)
    );
    const accessToken = tokenData?.access_token;

    if (accessToken) {
      // Nếu đã có connection và token khác → reconnect với token mới
      const currentToken = (wsManagerRef.current as any).currentToken;
      
      if (isInitializedRef.current && currentToken !== accessToken) {
        console.log('Token changed after refresh, reconnecting...');
        wsManagerRef.current.disconnect();
        wsManagerRef.current.connect(accessToken);
      } else if (!isInitializedRef.current) {
        // First time connect
        wsManagerRef.current.connect(accessToken);
        isInitializedRef.current = true;
      }
    }

    // Cleanup on unmount (optional)
    // return () => {
    //   wsManagerRef.current.disconnect();
    // };
  }, []); // Empty dependency để chỉ chạy 1 lần

  return wsManagerRef.current;
};