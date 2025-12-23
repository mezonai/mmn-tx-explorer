import { OFFERS_STATUS, P2P_TAB } from './constants';

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
  seller_user_id: string;
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
export interface P2POrder {
  order_id: number;
  offer_id: number;
  buyer_wallet_address: string;
  seller_wallet_address: string;
  amount: number;
  payable_amount: number;
  status: OfferStatus;
  transfer_code: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
  bank_info: string;
  price_rate: number;
}
export type P2PTabType = (typeof P2P_TAB)[keyof typeof P2P_TAB];
