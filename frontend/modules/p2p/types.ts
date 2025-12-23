import { OFFERS_STATUS } from './constants';

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
  bank_info?: {
    bank: string;
    account_number: string;
    account_name: string;
  };
  transfer_code?: string;
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
export interface CreateOfferRequest {
  side: TradeTypes;
  amount: number;
  price_rate: string;
  limit: {
    min: number;
    max: number;
  };
  bank_info: { bank: BankOption; account_number: string; account_name: string };
  symbol?: string;
}

export interface CreateOfferResponse {
  intermediary_wallet_address: string;
  offer: P2POffer;
}
export type OfferStatus = (typeof OFFERS_STATUS)[keyof typeof OFFERS_STATUS];
export interface UpdateOfferStatusRequest {
  offer_id: number;
  status: OfferStatus;
  tx_hash: string;
}
// Order status enum matching backend
export enum OrderStatus {
  OPEN = 'OPEN',
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELED = 'CANCELED',
  FAILED = 'FAILED',
  COMPLETED = 'COMPLETED',
}

// P2POrder interface matching backend schema
export interface P2POrder {
  order_id: string | number; // BIGSERIAL from backend
  offer_id: string | number; // BIGINT from backend
  buyer_wallet_address: string;
  seller_wallet_address?: string; // Seller wallet address from backend
  amount: number; // BIGINT - amount in MZD (smallest unit)
  price?: number; // BIGINT - price in VND (smallest unit) - deprecated, use payable_amount
  payable_amount?: number; // BIGINT - payable amount in VND (smallest unit) - from API response
  status: OrderStatus; // Default 'PENDING'
  bank_info?: {
    bank: string;
    account_number: string;
    account_name: string;
  };
  transfer_code?: string | null;
  expires_at: string; // TIMESTAMPTZ
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
  price_rate: number;
}

// Request interface for creating an order
export interface CreateOrderRequest {
  offer_id: string | number;
  amount: number; // Amount in MZD (smallest unit)
  price?: number | null; // Optional price in VND (calculated from offer if not provided)
}

// Request interface for updating order status
export interface UpdateOrderStatusRequest {
  status: OrderStatus | string;
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

export interface ProgressStep {
  id: number;
  label: string;
  status: OrderStatus;
}

export const PROGRESS_STEPS: ProgressStep[] = [
  { id: 1, label: 'Payment', status: OrderStatus.OPEN },
  { id: 2, label: 'Pending confirmation', status: OrderStatus.PENDING },
  { id: 3, label: 'Completed', status: OrderStatus.COMPLETED },
];