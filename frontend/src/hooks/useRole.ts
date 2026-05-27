import { useOrgStore, type OrgRole } from '../store/orgStore';

/**
 * Returns the current user's role in the active org, or null if no active org.
 * Uses a memoized Zustand selector to avoid unnecessary re-renders.
 */
export function useRole(): OrgRole | null {
  return useOrgStore((state) => {
    if (!state.activeOrgSlug) return null;
    const org = state.orgs.find((o) => o.slug === state.activeOrgSlug);
    return org?.role ?? null;
  });
}

export function useCanEdit(): boolean {
  const role = useRole();
  return role === 'owner' || role === 'editor';
}

export function useIsOwner(): boolean {
  const role = useRole();
  return role === 'owner';
}
