export const WALLET_ENDPOINTS = {
  LIST: '/:chainId/wallets',
  DETAILS: (address: string) => `/:chainId/wallets/${address}/detail`,
} as const;
export const WALLETS_QUERY_KEY = 'wallets';
