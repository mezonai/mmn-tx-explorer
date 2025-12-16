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
  private isConnecting = false;

  constructor(wsUrl: string = 'ws://localhost:8899') {
    this.wsUrl = wsUrl;
  }

  connect(token: string) {
    // If already connected with the same token, do nothing
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) &&
      this.currentToken === token
    ) {
      return;
    }

    // Prevent concurrent connection attempts (race condition protection)
    if (this.isConnecting) {
      return;
    }

    // If connected with different token, disconnect first to reconnect with new token
    if (this.ws && this.currentToken !== token) {
      this.shouldReconnect = false; // Prevent auto-reconnect during manual reconnect
      this.ws.close();
      this.ws = null;
    }

    this.isConnecting = true;
    this.currentToken = token;
    const url = `${this.wsUrl}/ws/connect?token=${encodeURIComponent(token)}`;
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.isConnecting = false;
      this.shouldReconnect = true;
      this.reconnectAttempts = 0;
      this.awaitingHeartbeatAck = false;
      this.startHeartbeat();
     
    };

    this.ws.onmessage = (event) => {
      try {
        if (event.data === HEARTBEAT_ACK) {
          this.awaitingHeartbeatAck = false;
          this.clearHeartbeatTimeout();
          return;
        }

        // Check if message indicates token expired
        let parsedData: unknown;
        try {
          parsedData = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        } catch {
          parsedData = event.data;
        }

        // Handle token expired error from server
        if (
          typeof parsedData === 'object' &&
          parsedData !== null &&
          ('error' in parsedData || 'status' in parsedData || 'code' in parsedData)
        ) {
          const errorData = parsedData as { error?: string; status?: number; code?: number; message?: string };
          const isTokenExpired =
            errorData.status === 401 ||
            errorData.code === 401 ||
            errorData.error?.toLowerCase().includes('token') ||
            errorData.error?.toLowerCase().includes('unauthorized') ||
            errorData.message?.toLowerCase().includes('token') ||
            errorData.message?.toLowerCase().includes('unauthorized');

          if (isTokenExpired) {
            this.handleTokenExpired();
            return;
          }
        }

        this.handleEvent(event.data);
      } catch {
        // Silently handle parsing errors
      }
    };

    this.ws.onclose = (event) => {
      this.isConnecting = false;
      this.stopHeartbeat();
      this.ws = null;

      // Check if close was due to authentication error (code 1008 = policy violation, often used for auth errors)
      // Some servers may close with 1008 when token is invalid
      if (event.code === 1008 || event.code === 1002) {
        this.handleTokenExpired();
      } else {
        this.attemptReconnect();
      }
    };

    this.ws.onerror = () => {
      this.isConnecting = false;
      // Silently handle WebSocket errors
    };
  }

  private attemptReconnect() {
    if (!this.shouldReconnect) {
      return;
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(async () => {
        // Always try to get fresh token (which will auto-refresh if needed)
        const freshToken = this.tokenProvider ? await this.tokenProvider() : this.getStoredToken();
        if (!freshToken) {
          return;
        }
        this.connect(freshToken);
      }, this.reconnectDelay);
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
    this.isConnecting = false;
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
          this.forceReconnect();
          return;
        }

        this.awaitingHeartbeatAck = true;
        this.ws.send(HEARTBEAT_CHECK);

        this.heartbeatTimeoutId = window.setTimeout(() => {
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
    this.stopHeartbeat();
    this.isConnecting = false;

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

  private async handleTokenExpired() {
    this.shouldReconnect = false; // Prevent normal reconnect
    this.isConnecting = false;

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.stopHeartbeat();

    // Try to get fresh token using token provider
    if (this.tokenProvider) {
      try {
        const freshToken = await this.tokenProvider();
        if (freshToken) {
          this.shouldReconnect = true;
          this.reconnectAttempts = 0; // Reset retry counter
          this.connect(freshToken);
          return;
        }
      } catch {
        // Silently handle token refresh errors
      }
    }

    // Fallback: try to get token from storage
    const storedToken = this.getStoredToken();
    if (storedToken) {
      this.shouldReconnect = true;
      this.reconnectAttempts = 0;
      this.connect(storedToken);
    }
  }
}

// Singleton instance
let wsManagerInstance: WebSocketManager | null = null;

export const getWebSocketManager = (): WebSocketManager => {
  if (!wsManagerInstance) {
    const globalProcess = (globalThis as { process?: { env?: Record<string, string> } } | undefined)?.process;
    const wsEnv = globalProcess?.env?.NEXT_PUBLIC_WEBSOCKET_URL;
    const wsUrl = wsEnv || 'ws://localhost:8899';
    wsManagerInstance = new WebSocketManager(wsUrl);
  }
  return wsManagerInstance;
};
