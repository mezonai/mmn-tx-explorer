import axios from 'axios';

const isServer = typeof window === 'undefined';
const baseURL = isServer
  ? process.env.APP_API_URL_INTERNAL || 'http://localhost:8080'
  : process.env.NEXT_PUBLIC_APP_API_URL;

const apiClient = axios.create({
  baseURL: "https://dev-mmn.nccsoft.vn/indexer-api",
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const isAbsolute = /^https?:\/\//i.test(config.url || "");
  if (isAbsolute) {
    console.warn("[apiClient] ABSOLUTE URL BYPASSES baseURL:", config.url);
  } else {
    console.info("[apiClient] baseURL:", config.baseURL, "url:", config.url);
  }
  return config;
});

export default apiClient;
