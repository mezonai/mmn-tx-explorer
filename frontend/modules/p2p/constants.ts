export const P2P_ENDPOINTS = {
  OFFERS: '/api/v1/offers',
  UPDATE_OFFER_STATUS: '/api/v1/offers/update-status',
  MY_OFFERS: '/api/v1/offers/me',
} as const;

export const P2P_QUERY_KEYS = {
  OFFERS: 'p2p-offers',
  OFFER: 'p2p-offer',
  ORDERS: 'p2p-orders',
  ORDER: 'p2p-order',
  MY_ORDERS: 'p2p-my-orders',
  MY_OFFERS: 'p2p-my-offers',
} as const;
export const OFFERS_STATUS = {
  OPEN: 'OPEN',
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  CANCELED: 'CANCELED',
  FAILED: 'FAILED',
} as const;
