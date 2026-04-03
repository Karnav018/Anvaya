import axios from 'axios';

const getBaseURL = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  // Fallback to localhost in dev, and /api in production
  return import.meta.env.DEV ? 'http://localhost:8000' : '/api';
};

export const apiInstance = axios.create({
  baseURL: getBaseURL(),
});
