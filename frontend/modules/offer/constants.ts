export const OFFER_ENDPOINTS = {
  CREATE: '/api/v1/offers',
  LIST: '/api/v1/offers',
  DETAIL: (id: number | string) => `/api/v1/offers/${id}`,
  CONFIRM: (id: number | string) => `/api/v1/offers/${id}/confirm`,
};
