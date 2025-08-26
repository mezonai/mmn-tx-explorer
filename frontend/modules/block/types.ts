import { ITransaction } from '../transaction';

export interface IBlock {
  base_fee_per_gas: number;
  block_hash: string;
  block_number: number;
  block_timestamp: number;
  chain_id: string;
  difficulty: string;
  extra_data: string;
  gas_limit: string;
  gas_used: string;
  logs_bloom: string;
  miner: string;
  mix_hash: string;
  nonce: string;
  parent_hash: string;
  receipts_root: string;
  sha3_uncles: string;
  size: number;
  state_root: string;
  total_difficulty: string;
  transaction_count: number;
  transactions_root: string;
  withdrawals_root: string;
}

export interface IBLockListParams {
  page: number;
  limit: number;
  sort_by: keyof IBlock;
  sort_order: 'asc' | 'desc';
}

export interface IBlockDetailsResponse {
  data: IBlockDetails;
}

export interface IBlockDetails {
  block: IBlock;
  transactions: ITransaction[];
}
