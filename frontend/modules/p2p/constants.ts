export const P2P_ENDPOINTS = {
  OFFERS: '/offers',
  OFFER_BY_ID: (id: string) => `/offers/${id}`,
  ORDERS: '/orders',
  ORDER_BY_ID: (id: string) => `/orders/${id}`,
  ORDER_STATUS: (id: string) => `/orders/${id}/status`,
  MY_ORDERS: '/orders/my',
} as const;

export const P2P_QUERY_KEYS = {
  OFFERS: 'p2p-offers',
  OFFER: 'p2p-offer',
  ORDERS: 'p2p-orders',
  ORDER: 'p2p-order',
  MY_ORDERS: 'p2p-my-orders',
} as const;
