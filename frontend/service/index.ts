import axios from 'axios';

const isServer = typeof window === 'undefined';

// Main Indexer API (existing)
const baseURL = isServer ? process.env.APP_API_URL_INTERNAL : process.env.NEXT_PUBLIC_APP_API_URL;

const apiClient = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Donation API (handles both donation campaigns and auth)
const donationBaseURL = isServer ? process.env.APP_DONATION_API_URL_INTERNAL : process.env.NEXT_PUBLIC_DONATION_API_URL;

const donationApiClient = axios.create({
  baseURL: donationBaseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptor for authentication
donationApiClient.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh on 401 errors
donationApiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Clear auth data on unauthorized
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_info');
      }
    }
    return Promise.reject(error);
  }
);

export { apiClient, donationApiClient };
