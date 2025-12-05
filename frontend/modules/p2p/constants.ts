export const P2P_ENDPOINTS = {
  OFFERS: '/api/v1/offers',
  OFFER_BY_ID: (id: string) => `/api/v1/offers/${id}`,
  OFFER_ORDERS: (id: string) => `/api/v1/offers/${id}/orders`,
  OFFER_CREATE: '/api/v1/offers/create',
  OFFER_CONFIRM: (id: string) => `/api/v1/offers/${id}/confirm`,
  ORDERS: '/api/v1/orders',
  ORDER_BY_ID: (id: string) => `/api/v1/orders/${id}`,
  ORDER_CONFIRM: (id: string) => `/api/v1/orders/${id}/confirm`,
  MY_ORDERS: '/api/v1/orders/my', // assumed; adjust if BE differs
} as const;

export const P2P_QUERY_KEYS = {
  OFFERS: 'p2p-offers',
  OFFER: 'p2p-offer',
  ORDERS: 'p2p-orders',
  ORDER: 'p2p-order',
  MY_ORDERS: 'p2p-my-orders',
} as const;
