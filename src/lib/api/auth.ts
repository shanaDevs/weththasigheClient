import api, { setAccessToken, clearTokens } from './client';
import type {
  ApiResponse,
  AuthResponse,
  LoginCredentials,
  RegisterData,
  User
} from '@/types';

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse & { twoFactorRequired?: boolean, isDoctorAccount?: boolean }> {
    const response = await api.post<ApiResponse<AuthResponse & { twoFactorRequired?: boolean, isDoctorAccount?: boolean }>>('/users/login', credentials);
    const data = response.data.data;

    if (data && data.twoFactorRequired) {
      return data;
    }

    const token = data?.accessToken || (data as any)?.token;
    if (response.data.success && token) {
      setAccessToken(token);
    }
    return { ...data, accessToken: token || '' };
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post<ApiResponse<AuthResponse>>('/users/register', data);
    const respData = response.data.data;
    const token = respData?.accessToken || (respData as any)?.token;
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

  async request2FAEnable(): Promise<ApiResponse<void>> {
    const response = await api.post<ApiResponse<void>>('/users/2fa/request-enable');
    return response.data;
  },

  async confirm2FAEnable(code: string): Promise<ApiResponse<void>> {
    const response = await api.post<ApiResponse<void>>('/users/2fa/confirm-enable', { code });
    return response.data;
  },

  async disable2FA(): Promise<ApiResponse<void>> {
    const response = await api.post<ApiResponse<void>>('/users/2fa/disable');
    return response.data;
  },

  async verify2FALogin(identity: string, code: string, isDoctorAccount: boolean): Promise<AuthResponse> {
    const response = await api.post<ApiResponse<AuthResponse>>('/users/2fa/verify-login', { identity, code, isDoctorAccount });
    const data = response.data.data;
    if (response.data.success && data.accessToken) {
      setAccessToken(data.accessToken);
    }
    return data;
  },
};
