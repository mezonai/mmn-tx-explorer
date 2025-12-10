// frontend/lib/websocket/websocket-manager.ts

import { STORAGE_KEYS } from '@/constant';
import { safeJsonParse } from '@/utils';
import { HEARTBEAT_ACK, HEARTBEAT_CHECK, HEARTBEAT_CHECK_INTERVAL_MS } from './constants';  

export interface WebSocketEvent {
  id?: string;
  type: string;
  payload?: string | Record<string, unknown>;
  receive_address?: string;
  status?: string;
  create_at?: string;
}

export class WebSocketManager {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private listeners: Map<string, Set<(data: WebSocketEvent) => void>> = new Map();
  private wsUrl: string;
  private heartbeatIntervalId: number | null = null;
  private shouldReconnect = true;

  constructor(wsUrl: string = 'ws://localhost:8899') {
    this.wsUrl = wsUrl;
  }

  connect(token: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    const url = `${this.wsUrl}/ws/connect?token=${encodeURIComponent(token)}`;
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.shouldReconnect = true;
      this.reconnectAttempts = 0;
      this.startHeartbeat();
      console.log('WebSocket connected');
    };

    this.ws.onmessage = (event) => {
      try {
        // Handle heartbeat reply from server
        if (event.data === HEARTBEAT_ACK) {
          console.log('Heartbeat ack received');
        }


        this.handleEvent(JSON.parse(event.data));
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.ws.onclose = () => {
      this.stopHeartbeat();
      this.ws = null;
      this.attemptReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  private attemptReconnect() {
    if (!this.shouldReconnect) {
      return;
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        const freshToken = this.getStoredToken();
        if (!freshToken) {
          console.error('No token available for reconnection');
          return;
        }
        this.connect(freshToken);
      }, this.reconnectDelay);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  private handleEvent(event: WebSocketEvent) {
    // Emit event to listeners
    const listeners = this.listeners.get(event.type);
    if (listeners) {
      listeners.forEach((listener) => listener(event));
    }

    // Also emit to wildcard listeners
    const wildcardListeners = this.listeners.get('*');
    if (wildcardListeners) {
      wildcardListeners.forEach((listener) => listener(event));
    }
  }

  on(eventType: string, callback: (data: WebSocketEvent) => void) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);
  }

  off(eventType: string, callback: (data: WebSocketEvent) => void) {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  disconnect() {
    if (this.ws) {
      this.shouldReconnect = false;
      this.ws.close();
      this.ws = null;
    }
    this.listeners.clear();
    this.stopHeartbeat();
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatIntervalId = window.setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(HEARTBEAT_CHECK);
      }
    }, HEARTBEAT_CHECK_INTERVAL_MS);
  }

  private stopHeartbeat() {
    if (this.heartbeatIntervalId !== null) {
      clearInterval(this.heartbeatIntervalId);
      this.heartbeatIntervalId = null;
    }
  }

  private send(payload: Record<string, unknown>) {
    try {
      this.ws?.send(JSON.stringify(payload));
    } catch (err) {
      console.error('Error sending WebSocket message:', err);
    }
  }

  private getStoredToken(): string | null {
    if (typeof window === 'undefined') {
      return null;
    }
    const tokenData = safeJsonParse<{ access_token?: string }>(
      localStorage.getItem(STORAGE_KEYS.TOKEN),
    );
    return tokenData?.access_token ?? null;
  }
}

// Singleton instance
let wsManagerInstance: WebSocketManager | null = null;

export const getWebSocketManager = (): WebSocketManager => {
  if (!wsManagerInstance) {
    const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:8899';
    wsManagerInstance = new WebSocketManager(wsUrl);
  }
  return wsManagerInstance;
};
