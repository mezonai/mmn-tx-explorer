export const WALLET_ENDPOINTS = {
  LIST: '/:chainId/wallets',
  DETAILS: (address: string) => `/:chainId/wallets/${address}/detail`,
} as const;
