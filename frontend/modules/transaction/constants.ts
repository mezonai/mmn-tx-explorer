export const TRANSACTION_ENDPOINTS = {
  LIST: '/:chainId/transactions',
  DETAIL: '/:chainId/transactions/:transactionHash',
} as const;

export const DASHBOARD_TRANSACTIONS_LIMIT = 7;
