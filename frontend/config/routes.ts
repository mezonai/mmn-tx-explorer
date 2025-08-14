export const ROUTES = {
  HOME: '/',
  TRANSACTIONS: '/transactions',
  BLOCKS: '/blocks',
} as const;

export type RouteKey = keyof typeof ROUTES;
export type RoutePath = (typeof ROUTES)[RouteKey];
