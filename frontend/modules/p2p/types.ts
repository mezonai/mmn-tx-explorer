import { OFFERS_STATUS, P2P_TAB, P2P_TRADING_ROLE } from './constants';
import type { ChannelMessageHandler } from 'mezon-light-sdk';

export type BankOption = 'MB' | 'VCB' | 'TCB' | 'ACB' | 'TPBANK' | 'VIETCOMBANK';

export interface P2POffer {
  offer_id: string;
  intermediary_wallet_id: number;
  intermediary_wallet_address?: string;
  offer_creator_wallet_address: string;
  total_amount: string;
  amount: string;
  limit: {
    min: string;
    max: string;
  };
  price_rate: number;
  price_type: string;
  side: TradeTypes;
  offer_creator_user_id: string;
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
  order_count?: number;
}

export interface IP2POfferListParams {
  page: number;
  limit: number;
  order_by?: string;
  from_amount?: number;
  to_amount?: number;
  order?: string;
  side?: TradeTypes;
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
  bank_info?: { bank: BankOption; account_number: string; account_name: string };
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
  WAITING_TRANSFER = 'WAITING_TRANSFER',
}

export interface P2POrder {
  order_id: string;
  offer_id: string;
  order_creator_wallet_address: string;
  order_creator_user_id: string;
  offer_creator_wallet_address: string;
  offer_creator_user_id: string;
  amount: string;
  price?: number;
  payable_amount?: string;
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
  offer_type?: TradeTypes;
  side: TradeTypes;
}
export type P2PTabType = (typeof P2P_TAB)[keyof typeof P2P_TAB];

export interface CreateOrderRequest {
  amount: number;
  bank_info?: { bank: BankOption; account_number: string; account_name: string };
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

export interface UserPaymentInfo {
  id: number;
  user_id: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
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
