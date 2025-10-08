import axios from 'axios';

const isServer = typeof window === 'undefined';
const baseURL = isServer
  ? process.env.APP_API_URL_INTERNAL
  : process.env.NEXT_PUBLIC_APP_API_URL;
// const baseURL = 'http://localhost:8080';
const apiClient = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;
