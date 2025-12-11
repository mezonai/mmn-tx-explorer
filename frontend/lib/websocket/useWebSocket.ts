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
    // Only initialize once
    if (isInitializedRef.current) {
      return;
    }

    const tokenData = safeJsonParse<{ access_token?: string }>(localStorage.getItem(STORAGE_KEYS.TOKEN));
    const accessToken = tokenData?.access_token;

    if (accessToken) {

      wsManagerRef.current.connect(accessToken);
      isInitializedRef.current = true;
    }

    // Don't disconnect on unmount - keep connection alive across component re-renders
    // return () => {
    //   wsManagerRef.current.disconnect();
    // };
  }, []);

  return wsManagerRef.current;
};

