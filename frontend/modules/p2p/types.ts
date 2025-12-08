export type BankOption = 'MB' | 'VCB' | 'TCB' | 'ACB' | 'TPBANK' | 'VIETCOMBANK';

export interface P2POffer {
  offer_id: number;
  intermediary_wallet_id?: number | null;
  wallet_address?: string;
  side: 'BUY' | 'SELL';
  symbol: string;
  quantity: number | string; // available quantity (backend may return large integers as string)
  total_quantity: number | string; // original total quantity
  price: number | string; // price (int64 on backend) - allow string for large ints
  price_rate?: string | null;
  price_type?: string;
  status?: string;
  // backend sometimes returns metadata as a JSON string. Accept either parsed object
  // or the raw JSON string to match the BE contract.
  metadata?: string | {
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
  symbol?: string;
  amount?: number;
  currency?: string;
  rate?: number;
  totalAmountFrom?: number;
  totalAmountTo?: number;
}