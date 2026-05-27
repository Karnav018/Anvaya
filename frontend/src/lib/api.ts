import axios, { AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

if (!API_URL) {
  console.error('VITE_API_URL is not defined in environment variables');
  throw new Error('API URL configuration is missing');
}

export const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    useUIStore.getState().startRequest();
    const access = useAuthStore.getState().access;
    if (access) {
      config.headers.Authorization = `Bearer ${access}`;
    }
    return config;
  },
  (error: AxiosError) => {
    useUIStore.getState().endRequest();
    return Promise.reject(error);
  }
);

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refresh = useAuthStore.getState().refresh;
  if (!refresh) return null;
  try {
    const res = await axios.post(
      `${API_URL}/auth/refresh`,
      { refresh },
      { headers: { 'Content-Type': 'application/json' }, timeout: 15000 }
    );
    const access: string | undefined = res.data?.access;
    const newRefresh: string | undefined = res.data?.refresh;
    if (!access) return null;
    if (newRefresh) {
      const user = useAuthStore.getState().user;
      useAuthStore.getState().setAuth(user as any, access, newRefresh);
    } else {
      useAuthStore.getState().setAccess(access);
    }
    return access;
  } catch {
    return null;
  }
}

api.interceptors.response.use(
  (response) => {
    useUIStore.getState().endRequest();
    return response;
  },
  async (error: AxiosError) => {
    useUIStore.getState().endRequest();

    if (error.code === 'ECONNABORTED') {
      toast.error('Request timeout. Please check your connection and try again.');
      return Promise.reject(error);
    }
    if (!error.response) {
      toast.error('Network error. Please check your internet connection.');
      return Promise.reject(error);
    }

    const status = error.response.status;
    const data = error.response.data as any;
    const config = error.config as (AxiosRequestConfig & { _retried?: boolean }) | undefined;

    if (status === 401 && config && !config._retried) {
      config._retried = true;
      if (!refreshPromise) refreshPromise = refreshAccessToken().finally(() => (refreshPromise = null));
      const newAccess = await refreshPromise;
      if (newAccess) {
        config.headers = { ...(config.headers || {}), Authorization: `Bearer ${newAccess}` } as any;
        return api.request(config);
      }
      toast.error('Session expired. Please login again.');
      useAuthStore.getState().logout();
      return Promise.reject(error);
    }

    switch (status) {
      case 400:
        toast.error(extractDetail(data) || 'Invalid request. Please check your input.');
        break;
      case 401:
        toast.error('Session expired. Please login again.');
        useAuthStore.getState().logout();
        break;
      case 403:
        toast.error("You don't have permission to perform this action.");
        break;
      case 404:
        toast.error(extractDetail(data) || 'Resource not found.');
        break;
      case 409:
        toast.error(extractDetail(data) || 'This resource already exists.');
        break;
      case 422: {
        const validationErrors = data?.detail;
        if (Array.isArray(validationErrors)) {
          const msg = validationErrors.map((err: any) => `${err.loc?.join(' → ')}: ${err.msg}`).join('\n');
          toast.error(msg || 'Validation error.');
        } else {
          toast.error(extractDetail(data) || 'Validation error.');
        }
        break;
      }
      case 429:
        toast.error(extractDetail(data) || 'Too many requests. Please slow down and try again later.');
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        toast.error('Server error. Please try again later.');
        console.error('Server error:', error.response);
        break;
      default:
        toast.error(extractDetail(data) || 'An unexpected error occurred.');
    }

    return Promise.reject(error);
  }
);

function extractDetail(data: any): string | undefined {
  if (!data) return undefined;
  if (typeof data.detail === 'string') return data.detail;
  if (data.detail && typeof data.detail === 'object' && typeof data.detail.message === 'string') {
    return data.detail.message;
  }
  return undefined;
}
