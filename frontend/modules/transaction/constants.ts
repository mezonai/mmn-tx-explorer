export const TRANSACTION_ENDPOINTS = {
  LIST: '/:chainId/transactions',
  PENDING: '/:chainId/pending-transactions',
  STATS: '/:chainId/stats/transactions',
  DETAIL: (transactionHash: string) => `/:chainId/internal/tx/${transactionHash}/detail`,
  PENDING_DETAIL: (transactionHash: string) => `/:chainId/pending-tx/${transactionHash}/detail`,
} as const;

export const DASHBOARD_TRANSACTIONS_LIMIT = 4;

export const TRANSACTIONS_QUERY_KEY = 'transactions';
export const PENDING_TRANSACTIONS_QUERY_KEY = 'pending-transactions';
