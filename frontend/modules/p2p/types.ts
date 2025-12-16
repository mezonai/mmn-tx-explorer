import { OFFERS_STATUS } from './constants';

export type BankOption = 'MB' | 'VCB' | 'TCB' | 'ACB' | 'TPBANK' | 'VIETCOMBANK';

export interface P2POffer {
  amount: number;
  created_at: string;
  intermediary_wallet_address: number;
  bankInfo?: {
    bank: BankOption;
    accountNumber: string;
    accountName: string;
  };
  limit: {
    min: number;
    max: number;
  };
  offer_id: string;
  price: number;
  price_rate: number;
  price_type: string;
  side: TradeTypes;
  seller_wallet_address: string;
  total_amount: number;

  symbol: string;
  update_at: string;
  status: string;
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
  status: OrderStatus | string; // Default 'PENDING'
  bank_info?:
    | string
    | {
        bank: string;
        account_number: string;
        account_name: string;
      }; // Can be JSON string or object
  transfer_code?: string | null;
  expires_at: string; // TIMESTAMPTZ
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
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
