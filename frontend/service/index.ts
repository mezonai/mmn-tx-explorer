import axios from 'axios';

const isServer = typeof window === 'undefined';
const baseURL = isServer
  ? "https://dev-mmn.nccsoft.vn/indexer-api" || 'http://localhost:8080'
  : "https://dev-mmn.nccsoft.vn/indexer-api";

const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;
