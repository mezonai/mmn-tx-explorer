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
