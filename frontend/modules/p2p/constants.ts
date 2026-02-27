export const P2P_ENDPOINTS = {
  OFFERS: '/api/v1/offers',
  UPDATE_OFFER_STATUS: '/api/v1/offers/update-status',
  MY_OFFERS: '/api/v1/offers/me',
  CANCEL_OFFER: (id: string) => `/api/v1/offers/${id}/cancel`,
  MY_ORDERS: '/api/v1/orders/me',
  OFFER_BY_ID: (id: string) => `/api/v1/offers/${id}`,
  CREATE_ORDER: (offerId: string) => `/api/v1/offers/${offerId}/orders`,
  ORDER_BY_ID: (id: string) => `/api/v1/orders/${id}`,
  ORDER_STATUS: (id: string) => `/api/v1/orders/${id}/confirm`,
  REOPEN_ORDER: (id: string) => `/api/v1/orders/${id}/reopen`,
  USER_PAYMENTS: '/api/v1/user-payments',
  USER_PAYMENTS_ME: '/api/v1/user-payments/me',
  DELETE_USER_PAYMENT: (id: string) => `/api/v1/user-payments/${id}`,
} as const;

export const P2P_QUERY_KEYS = {
  OFFERS: 'p2p-offers',
  OFFER: 'p2p-offer',
  ORDERS: 'p2p-orders',
  ORDER: 'p2p-order',
  MY_ORDERS: 'p2p-my-orders',
  MY_OFFERS: 'p2p-my-offers',
  USER_PAYMENTS: 'p2p-user-payments',
} as const;
export const OFFERS_STATUS = {
  OPEN: 'OPEN',
  CONFIRMED: 'CONFIRMED',
  CANCELED: 'CANCELED',
  FAILED: 'FAILED',
  COMPLETED: 'COMPLETED',
} as const;
export const P2P_TAB = {
  OFFERS: 'offers',
  MY_TRADING: 'my-trading',
  MY_OFFERS: 'my-offers',
} as const;

export const P2P_EVENT_TYPES = {
  ORDER_STATUS_UPDATED: 'ORDER_STATUS_UPDATED',
  ORDER_CONFIRMED: 'ORDER_CONFIRMED',
  ORDER_COMPLETED: 'ORDER_COMPLETED',
  OFFER_LIST_REFRESH: 'OFFER_LIST_REFRESH',
} as const;

export const BANK_OPTIONS = [
  { value: 'MB', label: 'MB Bank' },
  { value: 'VCB', label: 'Vietcombank' },
  { value: 'TCB', label: 'Techcombank' },
  { value: 'ACB', label: 'ACB' },
  { value: 'TPBANK', label: 'TPBank' },
  { value: 'VIETCOMBANK', label: 'Vietcombank' },
] as const;
export const P2P_STATS_STALE_TIME = 30000;
export const P2P_STATS_REFETCH_INTERVAL = 60000;

export const EMBED_MESSAGE_THEME = {
  INDIGO: '#6366f1',
  EMERAL: '10b981',
};
export const P2P_TRADING_ROLE = {
  BUYER: 'buyer',
  SELLER: 'seller',
};

export const MAX_CHAR_LIMIT = 5000;
export const MAX_FILE_SIZE = 20 * 1024 * 1024;

export const ORDER_EXPIRATION_DURATION_MS = 4 * 60 * 60 * 1000;
