import { ESortOrder } from '@/enums';
import { DASHBOARD_BLOCKS_LIMIT, IBLockListParams } from '../block';
import { DASHBOARD_TRANSACTIONS_LIMIT, ITransactionListParams } from '../transaction';

export const DASHBOARD_ENDPOINTS = {
  STATS: '/:chainId/stats/dashboard',
} as const;

export const DASHBOARD_STATS_QUERY_KEY = 'stats';
export const DASHBOARD_BLOCKS_QUERY_KEY = 'latest-blocks';
export const DASHBOARD_TRANSACTIONS_QUERY_KEY = 'latest-transactions';
export const DASHBOARD_BLOCK_FILTER: IBLockListParams = {
  page: 0,
  limit: DASHBOARD_BLOCKS_LIMIT,
  sort_by: 'block_number',
  sort_order: ESortOrder.DESC,
} as const;

export const DASHBOARD_TRANSACTION_FILTER: ITransactionListParams = {
  page: 0,
  limit: DASHBOARD_TRANSACTIONS_LIMIT,
  sort_by: 'transaction_timestamp',
  sort_order: ESortOrder.DESC,
} as const;
