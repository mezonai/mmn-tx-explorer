export type BankOption = 'MB' | 'VCB' | 'TCB' | 'ACB' | 'TPBANK' | 'VIETCOMBANK';

export interface P2POffer {
  offer_id: number;
  intermediary_wallet_id?: number | null;
  wallet_address?: string;
  side: 'BUY' | 'SELL';
  symbol: string;
  quantity: number; // available quantity
  total_quantity: number; // original total quantity
  price: number; // price (int64 on backend)
  price_rate?: string | null;
  price_type?: string;
  status?: string;
  metadata?: {
    bank: BankOption;
    account_name: string;
    account_number: string;
  } | null;
  created_at?: string;
  updated_at?: string;
}
export interface IP2POfferListParams {
  page: number;
  limit: number;
  rate?: number;
  totalAmountFrom?: number;
  totalAmountTo?: number;
}