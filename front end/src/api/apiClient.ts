import axios from 'axios';
import type { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import toast from 'react-hot-toast';

export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Create Central Axios Instance
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Configure default global axios settings as well to maintain backward compatibility
axios.defaults.baseURL = API_BASE_URL.startsWith('http') ? API_BASE_URL.replace(/\/api\/?$/, '') : '';
axios.defaults.withCredentials = true;

// Helper to retrieve auth token from all supported keys
export const getAuthToken = (): string | null => {
  return (
    localStorage.getItem('authToken') ||
    localStorage.getItem('token') ||
    localStorage.getItem('adminAuth') ||
    null
  );
};

// Helper to clear all auth tokens from localStorage
export const clearAuthTokens = (): void => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('token');
  localStorage.removeItem('adminAuth');
  localStorage.removeItem('user');
};

// Helper for authenticated native fetch calls
export const authFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return fetch(url, {
    ...options,
    headers,
    credentials: 'include'
  });
};

// Request Interceptor: Attach Authorization Bearer Token
apiClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Global Axios Request Interceptor
axios.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token && config.headers && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Normalized Error Handling & 401 Redirect Preservation
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError<any>) => {
    if (error.response) {
      const { status, data } = error.response;
      const message = data?.message || data?.error || 'An unexpected error occurred';

      if (status === 401) {
        const currentPath = window.location.pathname;
        const search = window.location.search;
        const fullDestination = encodeURIComponent(`${currentPath}${search}`);

        // Only redirect authenticated-only routes to avoid loops on public endpoints
        if (
          !currentPath.includes('/login') &&
          !currentPath.includes('/register') &&
          !currentPath.includes('/signup')
        ) {
          clearAuthTokens();
          if (currentPath.startsWith('/admin')) {
            window.location.href = `/admin/login?redirect=${fullDestination}`;
          } else if (
            currentPath.startsWith('/account') ||
            currentPath.startsWith('/checkout')
          ) {
            window.location.href = `/login?redirect=${fullDestination}`;
          }
        }
      } else if (status === 403) {
        toast.error(message || 'You do not have permission to perform this action.');
      } else if (status >= 500) {
        console.error('Server error encountered:', message);
      }
    } else if (error.request) {
      console.warn('Network connectivity issue. Server did not respond.');
    }
    return Promise.reject(error);
  }
);

export default apiClient;
