import axios from 'axios';

const isServer = typeof window === 'undefined';
const baseURL = isServer
  ? process.env.APP_API_URL_INTERNAL || 'http://localhost:8080'
  : process.env.NEXT_PUBLIC_APP_API_URL;

const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;
