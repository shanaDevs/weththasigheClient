import api, { setAccessToken, clearTokens } from './client';
import type { 
  ApiResponse, 
  AuthResponse, 
  LoginCredentials, 
  RegisterData,
  User 
} from '@/types';

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<ApiResponse<AuthResponse>>('/users/login', credentials);
    const data = response.data.data as AuthResponse & { token?: string };
    const token = data.accessToken || data.token;
    if (response.data.success && token) {
      setAccessToken(token);
    }
    return { ...data, accessToken: token || '' };
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post<ApiResponse<AuthResponse>>('/users/register', data);
    const respData = response.data.data as AuthResponse & { token?: string };
    const token = respData.accessToken || respData.token;
    if (response.data.success && token) {
      setAccessToken(token);
    }
    return { ...respData, accessToken: token || '' };
  },

  async logout(): Promise<void> {
    try {
      await api.post('/users/logout');
    } finally {
      clearTokens();
    }
  },

  async refreshToken(): Promise<AuthResponse> {
    const response = await api.post<ApiResponse<AuthResponse>>('/users/refresh-token');
    if (response.data.success && response.data.data.accessToken) {
      setAccessToken(response.data.data.accessToken);
    }
    return response.data.data;
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await api.get<ApiResponse<User>>('/users/me');
      return response.data.data;
    } catch {
      return null;
    }
  },
};
