import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../lib/api';

export interface User {
  id: string;
  email: string;
  name: string;
  plan: string;
  generations_used: number;
  generations_limit: number;
  generations_reset_at: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      setAuth: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null }),
      refreshUser: async () => {
        try {
          // If we have a token but no user, or just want to fresh our data
          if (get().token) {
            const res = await api.get('/auth/me');
            set({ user: res.data });
          }
        } catch (error) {
          console.error("Failed to refresh user:", error);
          set({ user: null, token: null });
        }
      },
    }),
    {
      name: 'anvaya-auth',
    }
  )
);
