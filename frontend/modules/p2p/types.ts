import { OFFERS_STATUS, P2P_TAB, P2P_TRADING_ROLE } from './constants';
import type { ChannelMessageHandler } from 'mezon-light-sdk';

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
  price_type: string;
  side: TradeTypes;
  seller_user_id: string;
  symbol: string;
  created_at: string;
  update_at: string;
  status: string;
  bank_info?: {
    bank: string;
    account_number: string;
    account_name: string;
  };
  transfer_code?: string;
  has_active_order?: boolean;
}

export interface IP2POfferListParams {
  page: number;
  limit: number;
  order_by?: string;
  from_amount?: number;
  to_amount?: number;
  order?: string;
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
export enum OrderStatus {
  OPEN = 'OPEN',
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELED = 'CANCELED',
  FAILED = 'FAILED',
  COMPLETED = 'COMPLETED',
}

export interface P2POrder {
  order_id: string;
  offer_id: string;
  buyer_wallet_address: string;
  buyer_user_id: string;
  seller_wallet_address: string;
  seller_user_id: string;
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
export type P2PTabType = (typeof P2P_TAB)[keyof typeof P2P_TAB];

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

export interface LinkLocation {
  url: string;
  start: number;
  end: number;
}
export interface ParsedMessageContent {
  t?: string;
  embed?: Array<{
    color?: string;
    title?: string;
    url?: string;
    description?: string;
    fields?: Array<{
      name?: string;
      value?: string;
      inline?: boolean;
    }>;
    timestamp?: string;
    footer?: {
      text?: string;
    };
  }>;
  mk?: string;
}

export type ChannelMessage = Parameters<ChannelMessageHandler>[0];

export interface MessageWithParsedContent extends Omit<ChannelMessage, 'content'> {
  content: ParsedMessageContent;
}
export type P2PTradingRoleType = (typeof P2P_TRADING_ROLE)[keyof typeof P2P_TRADING_ROLE];
export interface AutoMessagePayload {
  text: string;
  embed?: IEmbedProps[];
}
export interface IEmbedProps {
  color?: string;
  title?: string;
  url?: string;
  author?: {
    name: string;
    icon_url?: string;
    url?: string;
  };
  description?: string;
  thumbnail?: {
    url: string;
  };
  fields?: Array<{
    name: string;
    value: string;
    inline?: boolean;
  }>;
  image?: {
    url: string;
  };
  timestamp?: string;
  footer?: {
    text: string;
    icon_url?: string;
  };
}
