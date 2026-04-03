import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';

const getBaseURL = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  // Fallback to localhost in dev, and /api in production
  return import.meta.env.DEV ? 'http://localhost:8000' : '/api';
};

export const api = axios.create({
  baseURL: getBaseURL(),
});

// Automatically attach Bearer token and trigger loading bar
api.interceptors.request.use((config) => {
  useUIStore.getState().startRequest();
  
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  useUIStore.getState().endRequest();
  return Promise.reject(error);
});

// Automatically logout if we get a 401 Unauthorized and end loading
api.interceptors.response.use(
  (response) => {
    useUIStore.getState().endRequest();
    return response;
  },
  (error) => {
    useUIStore.getState().endRequest();
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);
