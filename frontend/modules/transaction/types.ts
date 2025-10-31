import { ESortOrder } from '@/enums';
import { ETransactionStatus, ETransactionTab, ETransactionType } from './enums';

export interface ITransactionStats {
  transactions_24h: number;
  pending_transactions_30m: number;
}

export interface ITransaction {
  block_hash: string;
  block_number: number;
  chain_id: string;
  from_address: string;
  hash: string;
  nonce: number;
  status: ETransactionStatus;
  to_address: string;
  transaction_type: ETransactionType;
  value: string;
  transaction_timestamp: number;
  text_data?: string;
}

export interface ITransactionListParams {
  page: number;
  limit: number;
  sort_by: keyof ITransaction;
  sort_order: ESortOrder;
  // TODO: update API to support tab, then update this to required
  tab?: ETransactionTab;
  filter_block_number?: number;
  wallet_address?: string;
  filter_to_address?: string;
  filter_from_address?: string;
}

export interface ILogInputData {
  name: string;
  type: 'address' | 'uint256';
  indexed: boolean;
  data: string;
}

export interface ITransactionLog {
  id: number;
  address: string;
  decode_input_data: {
    method_id: string;
    call: string;
    inputs: ILogInputData[];
  };
  topics: string[];
  data: string;
}

export interface ITransactionDetailsResponse {
  data: {
    transaction: ITransaction;
  };
}
