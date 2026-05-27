import { create } from 'zustand';
import { apiInstance } from '../lib/api-instance';
import { useAuthStore } from './authStore';

export type OrgRole = 'owner' | 'editor' | 'viewer';

export interface Org {
  id: string;
  slug: string;
  name: string;
  role: OrgRole;
  plan: string;
}

interface OrgState {
  orgs: Org[];
  activeOrgSlug: string | null;
  loading: boolean;
  loaded: boolean;
  loadOrgs: () => Promise<void>;
  setActiveOrg: (slug: string) => void;
  refresh: () => Promise<void>;
  reset: () => void;
}

const ACTIVE_ORG_KEY = 'anvaya-active-org';

function readPersistedActive(): string | null {
  try {
    return localStorage.getItem(ACTIVE_ORG_KEY);
  } catch {
    return null;
  }
}

function writePersistedActive(slug: string | null): void {
  try {
    if (slug === null) {
      localStorage.removeItem(ACTIVE_ORG_KEY);
    } else {
      localStorage.setItem(ACTIVE_ORG_KEY, slug);
    }
  } catch {
    // ignore localStorage errors (private mode, etc.)
  }
}

async function fetchOrgs(): Promise<Org[]> {
  const access = useAuthStore.getState().access;
  if (!access) return [];
  const res = await apiInstance.get<Org[]>('/orgs', {
    headers: { Authorization: `Bearer ${access}` },
  });
  return res.data ?? [];
}

export const useOrgStore = create<OrgState>((set, get) => ({
  orgs: [],
  activeOrgSlug: readPersistedActive(),
  loading: false,
  loaded: false,

  loadOrgs: async () => {
    if (get().loading) return;
    set({ loading: true });
    try {
      const orgs = await fetchOrgs();
      let activeOrgSlug = get().activeOrgSlug;
      const stillValid = activeOrgSlug && orgs.some((o) => o.slug === activeOrgSlug);
      if (!stillValid) {
        activeOrgSlug = orgs[0]?.slug ?? null;
        writePersistedActive(activeOrgSlug);
      }
      set({ orgs, activeOrgSlug, loaded: true, loading: false });
    } catch (err) {
      console.error('Failed to load orgs:', err);
      set({ loading: false, loaded: true });
    }
  },

  setActiveOrg: (slug: string) => {
    writePersistedActive(slug);
    set({ activeOrgSlug: slug });
  },

  refresh: async () => {
    set({ loaded: false });
    await get().loadOrgs();
  },

  reset: () => {
    writePersistedActive(null);
    set({ orgs: [], activeOrgSlug: null, loaded: false, loading: false });
  },
}));
