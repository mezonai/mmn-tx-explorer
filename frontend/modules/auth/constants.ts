export const AUTHENTICATION_ENDPOINT = {
  USER_INFO: '/oauth2/userinfo',
  LOGIN: '/oauth2/login',
  LOGOUT: '/oauth2/logout',
  REFRESH: 'refresh',
} as const;
export const AUTHENTICATION_CONSTANTS = {
  CRSF_TOKEN: 'csrf_token',
};
