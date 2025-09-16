export const TRANSACTION_ENDPOINTS = {
  LIST: '/:chainId/transactions',
  PENDING: '/:chainId/pending-transactions',
  DETAIL: (transactionHash: string) => `/:chainId/tx/${transactionHash}/detail`,
} as const;

export const DASHBOARD_TRANSACTIONS_LIMIT = 7;
