export const ROUTES = {
  HOME: '/',
  TRANSACTIONS: '/transactions',
  TRANSACTION: '/transactions/:id',
  BLOCKS: '/blocks',
  BLOCK: '/blocks/:id',
} as const;

export type RouteKey = keyof typeof ROUTES;
export type RoutePath = (typeof ROUTES)[RouteKey];
