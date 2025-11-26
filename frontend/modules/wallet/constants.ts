export const WALLET_ENDPOINTS = {
  LIST: '/:chainId/wallets',
  DETAILS: (address: string) => `/api/v1/wallets/${address}/detail`,
} as const;
export const WALLETS_QUERY_KEY = 'wallets';
