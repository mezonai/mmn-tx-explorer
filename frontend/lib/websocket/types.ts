export type WebSocketReadyState = 'CONNECTING' | 'OPEN' | 'CLOSING' | 'CLOSED';

export type WebSocketEventType =
  | 'p2p:order:status_update'
  | 'p2p:order:created'
  | 'p2p:order:cancelled'
  | 'p2p:order:completed';

export interface WebSocketEvent {
  type: WebSocketEventType;
  payload: Record<string, unknown>;
  timestamp?: string;
}

export interface OrderStatusUpdatePayload {
  orderId: string;
  status: string;
  updatedBy: string;
  order?: Record<string, unknown>;
}

export type WebSocketCallback = (event: WebSocketEvent) => void;
