// frontend/lib/websocket/websocket-manager.ts

import { STORAGE_KEYS } from '@/constant';
import { safeJsonParse } from '@/utils';
import { HEARTBEAT_ACK, HEARTBEAT_CHECK, HEARTBEAT_CHECK_INTERVAL_MS, HEARTBEAT_TIMEOUT_MS } from './constants';

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
  private heartbeatTimeoutId: number | null = null;
  private shouldReconnect = true;
  private awaitingHeartbeatAck = false;
  private tokenProvider: (() => Promise<string | null>) | null = null;
  public currentToken: string | null = null;

  constructor(wsUrl: string = 'ws://localhost:8899') {
    this.wsUrl = wsUrl;
  }

  connect(token: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.currentToken = token;
    const url = `${this.wsUrl}/ws/connect?token=${encodeURIComponent(token)}`;
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.shouldReconnect = true;
      this.reconnectAttempts = 0;
      this.awaitingHeartbeatAck = false;
      this.startHeartbeat();
      console.log('WebSocket connected');
    };

    this.ws.onmessage = (event) => {
      try {
        if (event.data === HEARTBEAT_ACK) {
          console.log('Heartbeat ACK received');
          this.awaitingHeartbeatAck = false;
          this.clearHeartbeatTimeout();
          return;
        }

        this.handleEvent(event.data);
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
      setTimeout(async () => {
        const freshToken = this.tokenProvider ? await this.tokenProvider() : this.getStoredToken();
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

  private handleEvent(event: unknown) {
    // If the payload has a `type` field, use it for routing; otherwise only wildcard listeners receive it.
    const eventType =
      typeof event === 'object' &&
      event !== null &&
      'type' in event &&
      typeof (event as { type?: unknown }).type === 'string'
        ? (event as { type: string }).type
        : undefined;

    // Emit event to listeners
    if (eventType) {
      const listeners = this.listeners.get(eventType);
      if (listeners) {
        listeners.forEach((listener) => listener(event as WebSocketEvent));
      }
    }

    // Also emit to wildcard listeners
    const wildcardListeners = this.listeners.get('*');
    if (wildcardListeners) {
      wildcardListeners.forEach((listener) => listener(event as WebSocketEvent));
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
    this.currentToken = null;
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
        if (this.awaitingHeartbeatAck) {
          console.warn('Heartbeat ACK not received, forcing reconnection');
          this.forceReconnect();
          return;
        }

        this.awaitingHeartbeatAck = true;
        this.ws.send(HEARTBEAT_CHECK);
        console.log('Heartbeat sent');

        this.heartbeatTimeoutId = window.setTimeout(() => {
          console.error('Heartbeat timeout - no ACK received');
          this.forceReconnect();
        }, HEARTBEAT_TIMEOUT_MS);
      }
    }, HEARTBEAT_CHECK_INTERVAL_MS);
  }

  private clearHeartbeatTimeout() {
    if (this.heartbeatTimeoutId !== null) {
      clearTimeout(this.heartbeatTimeoutId);
      this.heartbeatTimeoutId = null;
    }
  }

  private stopHeartbeat() {
    if (this.heartbeatIntervalId !== null) {
      clearInterval(this.heartbeatIntervalId);
      this.heartbeatIntervalId = null;
    }
    this.clearHeartbeatTimeout();
    this.awaitingHeartbeatAck = false;
  }

  private forceReconnect() {
    console.log('Forcing reconnection due to heartbeat failure');
    this.stopHeartbeat();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.attemptReconnect();
  }
  private getStoredToken(): string | null {
    if (typeof window === 'undefined') {
      return null;
    }
    const tokenData = safeJsonParse<{ access_token?: string }>(localStorage.getItem(STORAGE_KEYS.TOKEN));
    return tokenData?.access_token ?? null;
  }

  setTokenExpiredHandler(handler: () => Promise<string | null>) {
    this.tokenProvider = handler;
  }
}

// Singleton instance
let wsManagerInstance: WebSocketManager | null = null;

export const getWebSocketManager = (): WebSocketManager => {
  if (!wsManagerInstance) {
    const globalProcess = (globalThis as { process?: { env?: Record<string, string> } } | undefined)?.process;
    const wsEnv = globalProcess?.env?.NEXT_PUBLIC_WEBSOCKET_URL;
    const wsUrl = wsEnv || 'ws://172.16.10.111:8899';
    wsManagerInstance = new WebSocketManager(wsUrl);
  }
  return wsManagerInstance;
};
