import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { authService, clearTokens } from '@/lib/api';
import type { User, LoginCredentials, RegisterData } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  _hasHydrated: boolean;
  twoFactorRequired: boolean;
  twoFactorData: { identity: string; isDoctorAccount: boolean } | null;

  // Actions
  login: (credentials: LoginCredentials) => Promise<boolean>; // Returns true if 2FA is required
  verify2FA: (code: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  clearError: () => void;
  checkAuth: () => Promise<void>;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      _hasHydrated: false,
      twoFactorRequired: false,
      twoFactorData: null,

      setHasHydrated: (state) => {
        set({ _hasHydrated: state });
      },

      login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.login(credentials);

          if (response.twoFactorRequired) {
            set({
              twoFactorRequired: true,
              twoFactorData: {
                identity: credentials.identifier || credentials.phone || credentials.userName || '',
                isDoctorAccount: response.isDoctorAccount || false
              },
              isLoading: false
            });
            return true;
          }

          set({
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
            twoFactorRequired: false,
            twoFactorData: null
          });
          return false;
        } catch (error: unknown) {
          const message = error instanceof Error
            ? error.message
            : 'Login failed. Please try again.';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      verify2FA: async (code) => {
        set({ isLoading: true, error: null });
        try {
          const { twoFactorData } = useAuthStore.getState();
          if (!twoFactorData) throw new Error('Session expired. Please login again.');

          const response = await authService.verify2FALogin(
            twoFactorData.identity,
            code,
            twoFactorData.isDoctorAccount
          );

          set({
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
            twoFactorRequired: false,
            twoFactorData: null
          });
        } catch (error: unknown) {
          const message = error instanceof Error
            ? error.message
            : 'Verification failed. Please check your code.';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.register(data);
          set({
            user: response.user,
            isAuthenticated: true,
            isLoading: false
          });
        } catch (error: unknown) {
          const message = error instanceof Error
            ? error.message
            : 'Registration failed. Please try again.';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          await authService.logout();
        } finally {
          clearTokens();
          set({ user: null, isAuthenticated: false });
        }
      },

      setUser: (user) => {
        set({ user, isAuthenticated: !!user });
      },

      clearError: () => {
        set({ error: null });
      },

      checkAuth: async () => {
        set({ isLoading: true });
        try {
          const user = await authService.getCurrentUser();
          set({
            user,
            isAuthenticated: !!user,
            isLoading: false
          });
        } catch {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false
          });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
