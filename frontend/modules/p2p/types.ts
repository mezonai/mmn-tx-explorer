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
export interface CreateOfferResponse {
  intermediary_wallet_address: string;
  offer: P2POffer;
}
