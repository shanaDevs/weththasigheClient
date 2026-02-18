import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Create axios instance
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // For HTTP-only cookies
});

// Token management
let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
  if (token) {
    Cookies.set('access_token', token, { expires: 1 }); // 1 day
  } else {
    Cookies.remove('access_token');
  }
};

export const getAccessToken = (): string | null => {
  if (accessToken) return accessToken;
  return Cookies.get('access_token') || null;
};

export const clearTokens = () => {
  accessToken = null;
  Cookies.remove('access_token');
};

// Request interceptor - add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    // If 401 and not already retrying, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const response = await axios.post(`${API_URL}/users/refresh-token`, {}, {
          withCredentials: true,
        });
        
        if (response.data.success && response.data.data.accessToken) {
          setAccessToken(response.data.data.accessToken);
          
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${response.data.data.accessToken}`;
          }
          
          return api(originalRequest);
        }
      } catch {
        clearTokens();
        // Only redirect if not already on auth pages to prevent infinite loop
        if (typeof window !== 'undefined') {
          const currentPath = window.location.pathname;
          if (currentPath !== '/login' && currentPath !== '/register') {
            window.location.href = '/login';
          }
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
