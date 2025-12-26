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

export interface P2POrder {
  order_id: string | number;
  offer_id: string | number;
  buyer_wallet_address: string;
  seller_wallet_address: string;
  amount: number;
  price?: number;
  payable_amount?: number;
  status: OrderStatus;
  bank_info?: {
    bank: string;
    account_number: string;
    account_name: string;
  };
  transfer_code?: string | null;
  expires_at: string;
  created_at: string;
  updated_at: string;
  price_rate: number;
}

export interface CreateOrderRequest {
  amount: number;
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus | string;
  transfer_code?: string;
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