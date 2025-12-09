export type BankOption = 'MB' | 'VCB' | 'TCB' | 'ACB' | 'TPBANK' | 'VIETCOMBANK';

export interface P2POffer {
  offerId: string;
  wallet_address: string;
  total_quantity: number;
  quantity: number;
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
  quantity: number;
  price_rate: number;
  limit: {
    min: number;
    max: number;
  };
  metadata: { bank: BankOption; account_number: string; account_name: string };
  symbol: string;
}

export interface CreateOfferRequest {
  side: TradeTypes;
  quantity: string;
  price_rate: string;
  limit: {
    min: string;
    max: string;
  };
  metadata: { bank: BankOption; account_number: string; account_name: string };
  symbol: string;
}
