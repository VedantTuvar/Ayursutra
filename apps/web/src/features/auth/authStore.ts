import { create } from 'zustand';
import { UserRole } from '@ayursutra/shared-types';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  clinicId: string;
  clinicName: string;
}

interface AuthState {
  user: UserSession | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: UserSession, accessToken: string) => void;
  updateAccessToken: (accessToken: string) => void;
  clearAuth: () => void;
}

const STORAGE_KEY = 'ayursutra_auth_session';

// Initialize from localStorage safely
const getInitialState = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.user && parsed.accessToken) {
        return {
          user: parsed.user,
          accessToken: parsed.accessToken,
          isAuthenticated: true
        };
      }
    }
  } catch (e) {
    // Suppress local storage read errors
  }
  return {
    user: null,
    accessToken: null,
    isAuthenticated: false
  };
};

export const useAuthStore = create<AuthState>((set) => ({
  ...getInitialState(),

  setAuth: (user, accessToken) => {
    set({ user, accessToken, isAuthenticated: true });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, accessToken }));
    } catch (e) {}
  },

  updateAccessToken: (accessToken) => {
    set((state) => {
      const newState = { ...state, accessToken };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: state.user, accessToken }));
      } catch (e) {}
      return newState;
    });
  },

  clearAuth: () => {
    set({ user: null, accessToken: null, isAuthenticated: false });
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
  }
}));
export default useAuthStore;
