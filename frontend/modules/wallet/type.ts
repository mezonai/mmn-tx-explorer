import { ESortOrder } from '@/enums';

export interface IWallet {
  account_nonce: number;
  address: string;
  balance: number;
  rank: number;
  tx_timestamp: string;
}

export interface IWalletListParams {
  page: number;
  limit: number;
  sort_by: keyof IWallet;
  sort_order: ESortOrder;
  force_consistent_data: boolean;
}
