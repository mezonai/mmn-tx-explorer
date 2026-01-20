import { STORAGE_KEYS } from '@/constant';
import { safeJsonParse } from '@/utils';
import {
  HEARTBEAT_ACK,
  HEARTBEAT_CHECK,
  HEARTBEAT_CHECK_INTERVAL_MS,
  HEARTBEAT_TIMEOUT_MS,
  MAX_RECONNECT_ATTEMPTS,
  RECONNECT_DELAY_MS,
} from './constants';

export interface WebSocketEvent {
  id?: string;
  type: string;
  payload?: string | Record<string, unknown>;
  receive_address?: string;
  create_at?: string;
}

export class WebSocketManager {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = MAX_RECONNECT_ATTEMPTS;
  private reconnectDelay = RECONNECT_DELAY_MS;
  private listeners: Map<string, Set<(data: WebSocketEvent) => void>> = new Map();
  private wsUrl: string;
  private heartbeatIntervalId: number | null = null;
  private deadlineCheckIntervalId: number | null = null;
  private connectionDeadline = 0;
  private shouldReconnect = true;
  private tokenProvider: (() => Promise<string | null>) | null = null;
  public currentToken: string | null = null;
  private isConnecting = false;

  constructor() {
    this.wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:8899';
  }

  async connect(token?: string) {
    let activeToken = token;
    if (this.tokenProvider) {
      activeToken = (await this.tokenProvider()) || activeToken;
    }
    if (!activeToken) {
      activeToken = this.getStoredToken() || undefined;
    }
    if (!activeToken) {
      return;
    }
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) &&
      this.currentToken === activeToken
    ) {
      return;
    }
    if (this.isConnecting) {
      return;
    }
    if (this.ws && this.currentToken !== activeToken) {
      this.shouldReconnect = false;
      this.ws.close();
      this.ws = null;
    }

    this.isConnecting = true;
    this.currentToken = activeToken;
    const url = `${this.wsUrl}/ws/connect?token=${encodeURIComponent(activeToken)}`;
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.isConnecting = false;
      this.shouldReconnect = true;
      this.reconnectAttempts = 0;
      this.startHeartbeat();
      this.startDeadlineChecker();
    };

    this.ws.onmessage = (event) => {
      try {
        if (event.data === HEARTBEAT_ACK) {
          this.connectionDeadline = Date.now() + HEARTBEAT_TIMEOUT_MS;
          return;
        }

        let parsedData: unknown;
        try {
          parsedData = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        } catch (parseError) {
          console.error('[WebSocket] Failed to parse message:', parseError);
          parsedData = event.data;
        }

        if (
          parsedData &&
          typeof parsedData === 'object' &&
          'payload' in parsedData &&
          typeof parsedData.payload === 'string'
        ) {
          try {
            (parsedData as WebSocketEvent).payload = JSON.parse(parsedData.payload);
          } catch {
            // Keep original payload if parsing fails
          }
        }

        this.handleEvent(parsedData ?? event.data);
      } catch (error) {
        console.error(`[WebSocket] Error:`, error);
      }
    };

    this.ws.onclose = () => {
      this.isConnecting = false;
      this.stopHeartbeat();
      this.stopDeadlineChecker();
      this.ws = null;
    };

    this.ws.onerror = (event) => {
      this.isConnecting = false;
      console.error(`[WebSocket] Error:`, event);
    };
  }

  private attemptReconnect() {
    if (!this.shouldReconnect) {
      return;
    }
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay);
    }
  }

  private handleEvent(event: unknown) {
    const eventType =
      typeof event === 'object' &&
      event !== null &&
      'type' in event &&
      typeof (event as { type?: unknown }).type === 'string'
        ? (event as { type: string }).type
        : undefined;

    if (eventType) {
      const listeners = this.listeners.get(eventType);
      if (listeners) {
        listeners.forEach((listener) => listener(event as WebSocketEvent));
      }
    }
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
        this.ws.send(HEARTBEAT_CHECK);
      }
    }, HEARTBEAT_CHECK_INTERVAL_MS);
    this.connectionDeadline = Date.now() + HEARTBEAT_TIMEOUT_MS;
  }

  private stopHeartbeat() {
    if (this.heartbeatIntervalId !== null) {
      clearInterval(this.heartbeatIntervalId);
      this.heartbeatIntervalId = null;
    }
  }

  private startDeadlineChecker() {
    this.stopDeadlineChecker();
    this.deadlineCheckIntervalId = window.setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        if (Date.now() > this.connectionDeadline) {
          this.forceReconnect();
        }
      }
    }, 1000);
  }

  private stopDeadlineChecker() {
    if (this.deadlineCheckIntervalId !== null) {
      clearInterval(this.deadlineCheckIntervalId);
      this.deadlineCheckIntervalId = null;
    }
  }

  private forceReconnect() {
    this.stopHeartbeat();
    this.stopDeadlineChecker();
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
    this.tokenProvider = async () => {
      try {
        const token = await handler();
        return token;
      } catch (err) {
        console.error(`[WebSocket] Token refresh error:`, err);
        return null;
      }
    };
  }
}

let wsManagerInstance: WebSocketManager | null = null;

export const getWebSocketManager = (): WebSocketManager => {
  if (!wsManagerInstance) {
    wsManagerInstance = new WebSocketManager();
  }
  return wsManagerInstance;
};
