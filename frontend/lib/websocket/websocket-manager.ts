// frontend/lib/websocket/websocket-manager.ts

export interface WebSocketEvent {
  id?: string;
  type: string;
  payload?: string | Record<string, unknown>;
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

  constructor(wsUrl: string = 'ws://localhost:8899') {
    this.wsUrl = wsUrl;
  }

  connect(token: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    const url = `${this.wsUrl}/ws/connect?token=${encodeURIComponent(token)}`;
    console.log('Connecting to WebSocket:', url.replace(token, '***'));

    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log('✅ WebSocket connected');
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📨 WebSocket message received:', data);
        this.handleEvent(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.ws.onclose = () => {
      console.log('❌ WebSocket disconnected');
      this.ws = null;
      this.attemptReconnect(token);
    };

    this.ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
    };
  }

  private attemptReconnect(token: string) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      setTimeout(() => {
        this.connect(token);
      }, this.reconnectDelay);
    } else {
      console.error('❌ Max reconnection attempts reached');
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
      this.ws.close();
      this.ws = null;
    }
    this.listeners.clear();
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
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
