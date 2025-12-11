export type BankOption = 'MB' | 'VCB' | 'TCB' | 'ACB' | 'TPBANK' | 'VIETCOMBANK';

export interface P2POffer {
  offer_id: string;
  intermediary_wallet_id: number;
  seller_wallet_address: string;
  total_amount: number;
  amount: number;
  limit: {
    min: number;
    max: number;
  };
  price_rate: number;
  bankInfo?: {
    bank: BankOption;
    accountNumber: string;
    accountName: string;
  };
  transferCode?: string;
  symbol: string;
  created_at: string;
  update_at: string;
  status: string;
  price_type: string;
}

export interface IP2POfferListParams {
  page: number;
  limit: number;
  rate?: number;
  from_amount?: number;
  to_amount?: number;
}

export enum TradeTypes {
  SELL = 'SELL',
  BUY = 'BUY',
}

export interface CreateOfferFormState {
  side: TradeTypes;
  amount: number;
  price_rate: number;
  limit: {
    min: number;
    max: number;
  };
  bank_info: { bank: BankOption; account_number: string; account_name: string };
  symbol?: string;
}

export interface CreateOfferRequest {
  side: TradeTypes;
  amount: string;
  price_rate: string;
  limit: {
    min: string;
    max: string;
  };
  bank_info: { bank: BankOption; account_number: string; account_name: string };
  symbol?: string;
}

// Order status enum matching backend
export enum OrderStatus {
  OPEN = 'OPEN',
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELED = 'CANCELED',
  FAILED = 'FAILED',
}

// P2POrder interface matching backend schema
export interface P2POrder {
  order_id: string | number; // BIGSERIAL from backend
  offer_id: string | number; // BIGINT from backend
  buyer_wallet_address: string;
  amount: number; // BIGINT - amount in MZD (smallest unit)
  price: number; // BIGINT - price in VND (smallest unit)
  order_status: OrderStatus | string; // Default 'PENDING'
  transfer_code?: string | null;
  expires_at: string; // TIMESTAMPTZ
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
}

// Request interface for creating an order
export interface CreateOrderRequest {
  offer_id: string | number;
  amount: string | number; // Amount in MZD (smallest unit)
  price?: string | number; // Optional price in VND (calculated from offer if not provided)
}

// Request interface for updating order status
export interface UpdateOrderStatusRequest {
  order_status: OrderStatus | string;
  transfer_code?: string;
}

// Chat message interface
export interface ChatMessage {
  id: string;
  order_id: string;
  sender_type: 'buyer' | 'seller';
  sender_id: string;
  content: string;
  created_at: string;
}
