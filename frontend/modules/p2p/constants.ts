export const P2P_ENDPOINTS = {
  OFFERS: '/api/v1/offers',
  OFFER_BY_ID: (id: string) => `/api/v1/offers/${id}`,
  ORDERS: (id: string) => `/api/v1/offers/${id}/orders`,
  ORDER_BY_ID: (id: string) => `/api/v1/orders/${id}`,
  ORDER_STATUS: (id: string) => `/api/v1/orders/${id}/status`,
  MY_ORDERS: '/api/v1/orders/my',
} as const;

export const P2P_QUERY_KEYS = {
  OFFERS: 'p2p-offers',
  OFFER: 'p2p-offer',
  ORDERS: 'p2p-orders',
  ORDER: 'p2p-order',
  MY_ORDERS: 'p2p-my-orders',
} as const;
