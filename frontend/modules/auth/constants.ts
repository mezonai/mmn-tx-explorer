import { REDIRECT_ERROR_CODE } from 'next/dist/client/components/redirect-error';

export const AUTHENTICATION_ENDPOINT = {
  USER_INFO: '/oauth2/userinfo',
  LOGIN: '/oauth2/login',
  LOGOUT: '/oauth2/logout',
  REFRESH: 'refresh',
} as const;
export const AUTHENTICATION_CONSTANTS = {
  LOGIN_REDIRECT: 'login_redirect_',
};
