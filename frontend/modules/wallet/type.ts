import { ESortOrder } from '@/enums';

export interface IWallet {
  account_nonce: number;
  address: string;
  balance: number;
  rank: number;
  transaction_count: number;
}

export interface IWalletListParams {
  page: number;
  limit: number;
  sort_by: keyof IWallet;
  sort_order: ESortOrder;
  force_consistent_data: boolean;
}

export interface IWalletDetails {
  account_nonce: number;
  address: string;
  balance: string;
  transaction_count?: number;
  last_block?: number;
  updated_at: string;
  created_at: string;
}
