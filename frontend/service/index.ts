import { STORAGE_KEYS } from '@/constant';
import { AUTHENTICATION_ENDPOINT, AuthenticationService } from '@/modules/auth';
import { clearAuthStorage, safeJsonParse } from '@/utils';
import axios from 'axios';

const isServer = typeof window === 'undefined';
const baseURL = isServer ? process.env.APP_API_URL_INTERNAL : process.env.NEXT_PUBLIC_APP_API_URL;
const dongServiceURL = process.env.NEXT_PUBLIC_BACKEND_API_URL;
const gameServiceURL = process.env.NEXT_PUBLIC_TOP_MEZON_AI + '/api';
const ipfsServiceURL = process.env.NEXT_PUBLIC_BASE_FE + '/ipfs';
// const baseURL = 'http://localhost:8080';

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
// Add interceptor for authentication
apiDongClient.interceptors.request.use((config) => {
  if (config?.meta?.authOptional === true) return config;
  if (typeof window !== 'undefined') {
    const tokenData = safeJsonParse(localStorage.getItem(STORAGE_KEYS.TOKEN));
    if (tokenData?.access_token) {
      config.headers.Authorization = `Bearer ${tokenData.access_token}`;
    }
  }
  return config;
});


let isRefreshing = false;
let failedQueue: Array<{ resolve: (value?: unknown) => void; reject: (reason?: unknown) => void }> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// Handle token refresh on 401 errors
apiDongClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.url === AUTHENTICATION_ENDPOINT.REFRESH) {
        // Refresh token itself failed, clear auth and reject
        if (typeof window !== 'undefined') {
          clearAuthStorage();
        }
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return apiDongClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const localToken = safeJsonParse(localStorage.getItem(STORAGE_KEYS.TOKEN));
        await AuthenticationService.refreshLogin(localToken?.refresh_token);

        // Get the new token
        const newTokenData = safeJsonParse(localStorage.getItem(STORAGE_KEYS.TOKEN));
        if (newTokenData?.access_token) {
          originalRequest.headers.Authorization = `Bearer ${newTokenData.access_token}`;
        }

        processQueue(null, newTokenData?.access_token);
        isRefreshing = false;

        // Retry the original request
        return apiDongClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;

        console.error('Failed to refresh token', refreshError);
        // Clear auth data on unauthorized
        if (typeof window !== 'undefined') {
          clearAuthStorage();
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);


export { apiClient, apiDongClient, cobarClient, apiGameClient, ipfsServiceURL };
