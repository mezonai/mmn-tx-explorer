import { WebSocketReadyState, WebSocketEvent, WebSocketCallback, WebSocketEventType } from './types';

export class MockWebSocket {
  private readyState: WebSocketReadyState = 'CLOSED';
  private listeners: Map<string, Set<WebSocketCallback>> = new Map();
  private channels: Set<string> = new Set();

  connect(): void {
    this.readyState = 'CONNECTING';
    setTimeout(() => {
      this.readyState = 'OPEN';
      console.log('[MockWebSocket] Connected');
    }, 100);
  }

  disconnect(): void {
    this.readyState = 'CLOSING';
    setTimeout(() => {
      this.readyState = 'CLOSED';
      this.listeners.clear();
      this.channels.clear();
      console.log('[MockWebSocket] Disconnected');
    }, 100);
  }

  emit(eventType: string, payload: Record<string, unknown>, channel?: string): void {
    if (this.readyState !== 'OPEN') {
      console.warn('[MockWebSocket] Cannot emit: not connected');
      return;
    }

    const event: WebSocketEvent = {
      type: eventType as WebSocketEventType,
      payload,
      timestamp: new Date().toISOString(),
    };

    // Emit to specific channel listeners
    if (channel) {
      const channelKey = `channel:${channel}`;
      const channelListeners = this.listeners.get(channelKey);
      if (channelListeners) {
        channelListeners.forEach((callback) => {
          try {
            callback(event);
          } catch (error) {
            console.error('[MockWebSocket] Error in callback:', error);
          }
        });
      }
    }

    // Emit to global listeners
    const globalListeners = this.listeners.get(eventType);
    if (globalListeners) {
      globalListeners.forEach((callback) => {
        try {
          callback(event);
        } catch (error) {
          console.error('[MockWebSocket] Error in callback:', error);
        }
      });
    }
  }

  on(eventType: string, callback: WebSocketCallback): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);
  }

  off(eventType: string, callback: WebSocketCallback): void {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.delete(callback);
      if (listeners.size === 0) {
        this.listeners.delete(eventType);
      }
    }
  }

  subscribe(channel: string, callback: WebSocketCallback): void {
    this.channels.add(channel);
    const channelKey = `channel:${channel}`;
    this.on(channelKey, callback);
  }

  unsubscribe(channel: string, callback: WebSocketCallback): void {
    const channelKey = `channel:${channel}`;
    this.off(channelKey, callback);
    if (!this.listeners.has(channelKey) || this.listeners.get(channelKey)!.size === 0) {
      this.channels.delete(channel);
    }
  }

  getReadyState(): WebSocketReadyState {
    return this.readyState;
  }

  isConnected(): boolean {
    return this.readyState === 'OPEN';
  }
}
