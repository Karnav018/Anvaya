import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import toast from 'react-hot-toast';

// Get API URL from environment variables with fallback
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Validate API URL on startup
if (!API_URL) {
  console.error('VITE_API_URL is not defined in environment variables');
  throw new Error('API URL configuration is missing');
}

export const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Attach auth token and start loading
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    useUIStore.getState().startRequest();
    
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    useUIStore.getState().endRequest();
    return Promise.reject(error);
  }
);

// Response interceptor: Handle errors globally
api.interceptors.response.use(
  (response) => {
    useUIStore.getState().endRequest();
    return response;
  },
  (error: AxiosError) => {
    useUIStore.getState().endRequest();

    // Handle different error types
    if (error.code === 'ECONNABORTED') {
      // Timeout error
      toast.error('Request timeout. Please check your connection and try again.');
    } else if (!error.response) {
      // Network error (no response from server)
      toast.error('Network error. Please check your internet connection.');
    } else {
      // HTTP error responses
      const status = error.response.status;
      const data = error.response.data as any;

      switch (status) {
        case 400:
          // Bad Request - show specific error message if available
          toast.error(data?.detail || 'Invalid request. Please check your input.');
          break;

        case 401:
          // Unauthorized - logout and redirect to login
          toast.error('Session expired. Please login again.');
          useAuthStore.getState().logout();
          break;

        case 403:
          // Forbidden - user doesn't have permission
          toast.error('You don\'t have permission to perform this action.');
          break;

        case 404:
          // Not Found
          toast.error(data?.detail || 'Resource not found.');
          break;

        case 409:
          // Conflict (e.g., duplicate resource)
          toast.error(data?.detail || 'This resource already exists.');
          break;

        case 422:
          // Validation Error (FastAPI)
          const validationErrors = data?.detail;
          if (Array.isArray(validationErrors)) {
            const errorMessages = validationErrors.map((err: any) => 
              `${err.loc?.join(' → ')}: ${err.msg}`
            ).join('\n');
            toast.error(errorMessages || 'Validation error.');
          } else {
            toast.error(data?.detail || 'Validation error.');
          }
          break;

        case 429:
          // Rate Limit Exceeded
          toast.error('Too many requests. Please slow down and try again later.');
          break;

        case 500:
        case 502:
        case 503:
        case 504:
          // Server errors
          toast.error('Server error. Please try again later.');
          console.error('Server error:', error.response);
          break;

        default:
          // Generic error
          toast.error(data?.detail || 'An unexpected error occurred.');
      }
    }

    return Promise.reject(error);
  }
);
