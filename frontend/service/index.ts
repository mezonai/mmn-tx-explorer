import { STORAGE_KEYS } from '@/constant';
import { AuthenticationService } from '@/modules/auth';
import { clearAuthStorage, safeJsonParse } from '@/utils';
import axios from 'axios';

const isServer = typeof window === 'undefined';
const baseURL = isServer ? process.env.APP_API_URL_INTERNAL : process.env.NEXT_PUBLIC_APP_API_URL;
const dongServiceURL = process.env.NEXT_PUBLIC_BACKEND_API_URL;
const gameServiceURL = process.env.NEXT_PUBLIC_TOP_MEZON_AI + '/api';
const ipfsServiceURL = process.env.NEXT_PUBLIC_BASE_FE + '/ipfs';
// const baseURL = 'http://localhost:8080';
const serverkey = process.env.NEXT_PUBLIC_MEZON_SERVER_KEY!;
const cobarClient = axios.create({
  baseURL: '/api/cobar',
  headers: {
    'Content-Type': 'application/json',
  },
});
const apiClient = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const apiDongClient = axios.create({
  baseURL: dongServiceURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const apiGameClient = axios.create({
  baseURL: gameServiceURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const authClient = axios.create({
  baseURL: dongServiceURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptor for authentication
apiDongClient.interceptors.request.use(
  async (config) => {
    if (config?.meta?.authOptional === true) return config;

    if (AuthenticationService.getIsRefreshing()) {
      await AuthenticationService.waitRefresh();
    }

    if (typeof window !== 'undefined') {
      const tokenData = safeJsonParse(localStorage.getItem(STORAGE_KEYS.TOKEN));
      if (tokenData?.access_token) {
        config.headers.Authorization = `Bearer ${tokenData.access_token}`;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle token refresh on 401 errors
apiDongClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const localToken = safeJsonParse(localStorage.getItem(STORAGE_KEYS.TOKEN));
        await AuthenticationService.refreshLogin(localToken?.refresh_token);

        const newTokenData = safeJsonParse(localStorage.getItem(STORAGE_KEYS.TOKEN));
        originalRequest.headers.Authorization = `Bearer ${newTokenData.access_token}`;
        return apiDongClient(originalRequest);
      } catch (refreshError) {
        clearAuthStorage();
        console.error(`[Interceptor] Refresh failed.`, refreshError);
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export { apiClient, apiDongClient, cobarClient, apiGameClient, ipfsServiceURL, serverkey, authClient };
