import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiInstance } from '../lib/api-instance';

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
  access: string | null;
  refresh: string | null;
  setAuth: (user: User, access: string, refresh: string) => void;
  setAccess: (access: string) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

// Dynamically import orgStore to avoid circular imports between
// authStore <-> orgStore (orgStore imports from authStore for the token).
async function syncOrgsAfterAuth(): Promise<void> {
  try {
    const mod = await import('./orgStore');
    await mod.useOrgStore.getState().loadOrgs();
  } catch (err) {
    console.error('Failed to sync orgs after auth:', err);
  }
}

async function clearOrgsAfterLogout(): Promise<void> {
  try {
    const mod = await import('./orgStore');
    mod.useOrgStore.getState().reset();
  } catch (err) {
    console.error('Failed to clear orgs after logout:', err);
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      access: null,
      refresh: null,
      setAuth: (user, access, refresh) => {
        set({ user, access, refresh });
        // Fire-and-forget: refresh org list when auth changes.
        void syncOrgsAfterAuth();
      },
      setAccess: (access) => set({ access }),
      logout: () => {
        set({ user: null, access: null, refresh: null });
        void clearOrgsAfterLogout();
      },
      refreshUser: async () => {
        try {
          if (get().access) {
            const res = await apiInstance.get('/auth/me', {
              headers: { Authorization: `Bearer ${get().access}` },
            });
            set({ user: res.data });
          }
        } catch (error) {
          console.error('Failed to refresh user:', error);
          set({ user: null, access: null, refresh: null });
          void clearOrgsAfterLogout();
        }
      },
    }),
    {
      name: 'anvaya-auth',
      version: 2,
    }
  )
);
