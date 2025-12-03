'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import WebSocketManager from '@/lib/websocket/websocket-manager';
import { WebSocketEvent, WebSocketCallback } from '@/lib/websocket/types';
import { useUser } from './AppProvider';

interface WebSocketContextType {
  isConnected: boolean;
  emit: (eventType: string, payload: Record<string, unknown>, channel?: string) => void;
  on: (eventType: string, callback: WebSocketCallback) => void;
  off: (eventType: string, callback: WebSocketCallback) => void;
  subscribe: (channel: string, callback: WebSocketCallback) => void;
  unsubscribe: (channel: string, callback: WebSocketCallback) => void;
  emitOrderStatusUpdate: (
    orderId: string,
    status: string,
    updatedBy: string,
    order?: Record<string, unknown>,
    sellerId?: string
  ) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

interface WebSocketProviderProps {
  children: ReactNode;
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const { user } = useUser();
  const [isConnected, setIsConnected] = useState(false);
  const manager = WebSocketManager.getInstance();

  // Expose manager to window for testing in development
  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      (window as any).__wsManager = manager;
      console.log('[WebSocketProvider] WebSocketManager exposed to window.__wsManager for testing');
      console.log('[WebSocketProvider] Usage: window.__wsManager.emitOrderStatusUpdate(...)');
    }
  }, [manager]);

  useEffect(() => {
    if (user?.id) {
      manager.connect(user.id);
      setIsConnected(true);

      return () => {
        manager.disconnect();
        setIsConnected(false);
      };
    }
  }, [user?.id]);

  const value: WebSocketContextType = {
    isConnected,
    emit: (eventType, payload, channel) => manager.emit(eventType, payload, channel),
    on: (eventType, callback) => manager.on(eventType, callback),
    off: (eventType, callback) => manager.off(eventType, callback),
    subscribe: (channel, callback) => manager.subscribe(channel, callback),
    unsubscribe: (channel, callback) => manager.unsubscribe(channel, callback),
    emitOrderStatusUpdate: (orderId, status, updatedBy, order, sellerId) =>
      manager.emitOrderStatusUpdate(orderId, status, updatedBy, order, sellerId),
  };

  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>;
}

export function useWebSocket(): WebSocketContextType {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}

