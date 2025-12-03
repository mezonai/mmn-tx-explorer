import { MockWebSocket } from './mock-websocket';
import { WebSocketEvent, WebSocketCallback, OrderStatusUpdatePayload } from './types';

class WebSocketManager {
  private static instance: WebSocketManager | null = null;
  private ws: MockWebSocket;
  private userId: string | null = null;

  private constructor() {
    this.ws = new MockWebSocket();
  }

  static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  connect(userId: string): void {
    this.userId = userId;
    this.ws.connect();
  }

  disconnect(): void {
    this.ws.disconnect();
    this.userId = null;
  }

  emit(eventType: string, payload: Record<string, unknown>, channel?: string): void {
    this.ws.emit(eventType, payload, channel);
  }

  on(eventType: string, callback: WebSocketCallback): void {
    this.ws.on(eventType, callback);
  }

  off(eventType: string, callback: WebSocketCallback): void {
    this.ws.off(eventType, callback);
  }

  subscribe(channel: string, callback: WebSocketCallback): void {
    this.ws.subscribe(channel, callback);
  }

  unsubscribe(channel: string, callback: WebSocketCallback): void {
    this.ws.unsubscribe(channel, callback);
  }

  // Helper method for order status updates
  emitOrderStatusUpdate(
    orderId: string,
    status: string,
    updatedBy: string,
    order?: Record<string, unknown>,
    sellerId?: string
  ): void {
    const payload: OrderStatusUpdatePayload = {
      orderId,
      status,
      updatedBy,
      order,
    };

    // Emit to seller's channel if provided
    if (sellerId) {
      const channel = `user:${sellerId}:orders`;
      this.emit('p2p:order:status_update', payload, channel);
    } else {
      // Emit globally
      this.emit('p2p:order:status_update', payload);
    }
  }

  isConnected(): boolean {
    return this.ws.isConnected();
  }

  getUserId(): string | null {
    return this.userId;
  }
}

export default WebSocketManager;

