// frontend/lib/websocket/websocket-manager.ts

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
  status?: string;
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
  private connectionDeadline: number = 0;
  private shouldReconnect = true;
  private tokenProvider: (() => Promise<string | null>) | null = null;
  public currentToken: string | null = null;
  private isConnecting = false;

  constructor(wsUrl: string = 'ws://localhost:8899') {
    this.wsUrl = wsUrl;
  }

  async connect(token?: string) {
    // Get fresh token if not provided or always try to get the latest from provider
    let activeToken = token;
    if (this.tokenProvider) {
      activeToken = (await this.tokenProvider()) || activeToken;
    }

    if (!activeToken) {
      activeToken = this.getStoredToken() || undefined;
    }

    if (!activeToken) {
      console.warn('No token available for WebSocket connection');
      return;
    }

    // If already connected with the same token, do nothing
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) &&
      this.currentToken === activeToken
    ) {
      return;
    }

    // Prevent concurrent connection attempts
    if (this.isConnecting) {
      return;
    }

    // If connected with different token, disconnect first
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
      console.log('Websocket connected');
    };

    this.ws.onmessage = (event) => {
      try {
        if (event.data === HEARTBEAT_ACK) {
          // Extend deadline on valid Pong
          this.connectionDeadline = Date.now() + HEARTBEAT_TIMEOUT_MS;
          return;
        }

        // Parse and handle message
        let parsedData: unknown;
        try {
          parsedData = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        } catch {
          parsedData = event.data;
        }

        console.log('Websocket message received:', parsedData);
        this.handleEvent(parsedData ?? event.data);
      } catch (error) {
        console.error('Error handling websocket message:', error);
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
      setTimeout(() => {
        this.connect(); // connect() now handles token refreshing internally
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

    // Set initial deadline
    this.connectionDeadline = Date.now() + HEARTBEAT_TIMEOUT_MS;

    this.heartbeatIntervalId = window.setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        // 1. Check Deadline
        if (Date.now() > this.connectionDeadline) {
          console.warn('Heartbeat deadline exceeded, reconnecting...');
          this.forceReconnect();
          return;
        }

        // 2. Send usage Ping (Blindly)
        // We don't care if this specific ping is acknowledged,
        // we just care that we receive *some* ACK eventually to extend the deadline.
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
    this.isConnecting = false;

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.stopHeartbeat();
    this.reconnectAttempts = 0; // Reset retry counter for a "fresh" start
    this.connect(); // This will refresh token via provider
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
