import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useOrgStore } from '../store/orgStore';
import { useAuthStore } from '../store/authStore';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

/**
 * Back-compat redirect: anything pointing at /dashboard gets bounced to
 * the active org's dashboard. If the user has no orgs, send them to
 * onboarding instead.
 */
export default function DashboardRedirect() {
  const access = useAuthStore((s) => s.access);
  const activeOrgSlug = useOrgStore((s) => s.activeOrgSlug);
  const orgs = useOrgStore((s) => s.orgs);
  const loaded = useOrgStore((s) => s.loaded);
  const loading = useOrgStore((s) => s.loading);
  const loadOrgs = useOrgStore((s) => s.loadOrgs);

  useEffect(() => {
    if (access && !loaded && !loading) {
      void loadOrgs();
    }
  }, [access, loaded, loading, loadOrgs]);

  if (!access) {
    return <Navigate to="/login" replace />;
  }

  if (!loaded) {
    return <LoadingSpinner />;
  }

  if (orgs.length === 0) {
    return <Navigate to="/onboarding" replace />;
  }

  const target = activeOrgSlug && orgs.find((o) => o.slug === activeOrgSlug)
    ? activeOrgSlug
    : orgs[0].slug;

  return <Navigate to={`/o/${target}/dashboard`} replace />;
}
