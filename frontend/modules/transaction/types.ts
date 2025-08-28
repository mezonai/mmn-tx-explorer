import { ESortOrder } from '@/enums';
import { ETransactionStatus, ETransactionTab, ETransactionType } from './enums';

export interface ITransaction {
  access_list_json: string;
  blob_gas_price: string;
  blob_gas_used: number;
  block_hash: string;
  block_number: number;
  block_timestamp: number;
  chain_id: string;
  contract_address: string;
  cumulative_gas_used: number;
  data: string;
  effective_gas_price: string;
  from_address: string;
  function_selector: string;
  gas: number;
  gas_price: string;
  gas_used: number;
  hash: string;
  logs_bloom: string;
  max_fee_per_gas: string;
  max_priority_fee_per_gas: string;
  nonce: number;
  r: string;
  s: string;
  status: ETransactionStatus;
  to_address: string;
  transaction_index: number;
  transaction_type: ETransactionType;
  v: string;
  value: string;
}

export interface ITransactionListParams {
  page: number;
  limit: number;
  sort_by: keyof ITransaction;
  sort_order: ESortOrder;
  // TODO: update API to support tab, then update this to required
  tab?: ETransactionTab;
}
