export const ROUTES = {
  HOME: '/',
  TRANSACTIONS: '/transactions',
  TRANSACTION: (hash: string, queryParams?: string) => `/transactions/${hash}${queryParams ? `?${queryParams}` : ''}`,
  BLOCKS: '/blocks',
  BLOCK: (number: number, queryParams?: string) => `/blocks/${number}${queryParams ? `?${queryParams}` : ''}`,
  WALLETS: '/wallets',
  WALLET: (address: string, queryParams?: string) => `/wallets/${address}${queryParams ? `?${queryParams}` : ''}`,
} as const;
