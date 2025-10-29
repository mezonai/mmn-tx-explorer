import { STORAGE_KEYS } from '@/constant';
import { clearAuthStorage, safeJsonParse } from '@/utils';
import axios from 'axios';

const isServer = typeof window === 'undefined';
const baseURL = isServer ? process.env.APP_API_URL_INTERNAL : process.env.NEXT_PUBLIC_APP_API_URL;
const dongServiceURL = process.env.NEXT_PUBLIC_BACKEND_API_URL;
// const baseURL = 'http://localhost:8080';
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

// Add interceptor for authentication
apiDongClient.interceptors.request.use((config) => {
  return config;
});

// Handle token refresh on 401 errors
apiDongClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        clearAuthStorage();
      }
    }
    return Promise.reject(error);
  }
);

export { apiClient, apiDongClient };
