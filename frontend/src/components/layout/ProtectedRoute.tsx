import { useEffect, type ReactNode } from 'react';
import { Navigate, useLocation, useParams } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useOrgStore } from '../../store/orgStore';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface ProtectedRouteProps {
  children: ReactNode;
  /**
   * When true, the route is org-scoped — the URL is expected to contain
   * a :orgSlug param, and the user must belong to that org.
   */
  requiresOrg?: boolean;
}

export function ProtectedRoute({ children, requiresOrg = false }: ProtectedRouteProps) {
  const access = useAuthStore((state) => state.access);
  const location = useLocation();
  const params = useParams();

  const orgs = useOrgStore((s) => s.orgs);
  const activeOrgSlug = useOrgStore((s) => s.activeOrgSlug);
  const loaded = useOrgStore((s) => s.loaded);
  const loading = useOrgStore((s) => s.loading);
  const loadOrgs = useOrgStore((s) => s.loadOrgs);
  const setActiveOrg = useOrgStore((s) => s.setActiveOrg);

  useEffect(() => {
    if (access && !loaded && !loading) {
      void loadOrgs();
    }
  }, [access, loaded, loading, loadOrgs]);

  if (!access) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Wait for org list before deciding any org-scoped redirects.
  if (!loaded) {
    return <LoadingSpinner />;
  }

  if (requiresOrg) {
    if (orgs.length === 0) {
      return <Navigate to="/onboarding" replace />;
    }

    const urlSlug = params.orgSlug;
    if (urlSlug) {
      const validOrg = orgs.find((o) => o.slug === urlSlug);
      if (!validOrg) {
        // Unknown slug — fall back to the active org's dashboard.
        return <Navigate to="/dashboard" replace />;
      }
      // Keep activeOrg synced to URL.
      if (activeOrgSlug !== urlSlug) {
        setActiveOrg(urlSlug);
      }
    }
  }

  return <>{children}</>;
}
