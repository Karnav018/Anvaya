import { Routes, Route } from 'react-router-dom';
import { Suspense, lazy, type ReactNode } from 'react';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { TopLoadingBar } from './components/ui/TopLoadingBar';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import { UpgradeModal } from './components/billing/UpgradeModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { RouteErrorFallback } from './components/RouteErrorFallback';

// Lazy load heavy components
const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Pricing = lazy(() => import('./pages/Pricing'));
const AppShell = lazy(() => import('./components/layout/AppShell').then((m) => ({ default: m.AppShell })));
const ProjectDashboard = lazy(() => import('./pages/ProjectDashboard'));
const Editor = lazy(() => import('./pages/Editor'));
const CodePreview = lazy(() => import('./pages/CodePreview'));
const DashboardRedirect = lazy(() => import('./pages/DashboardRedirect'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const AcceptInvite = lazy(() => import('./pages/AcceptInvite'));
const SettingsTeam = lazy(() => import('./pages/Settings/Team'));
const SettingsOrganization = lazy(() => import('./pages/Settings/Organization'));
const SettingsBilling = lazy(() => import('./pages/Settings/Billing'));
const SettingsProfile = lazy(() => import('./pages/Settings/Profile'));

// Docs (MDX) — lazy chunks so they don't bloat the landing bundle
const DocsLayout = lazy(() => import('./pages/docs/_layout'));
const DocsIndex = lazy(() => import('./pages/docs/index.mdx'));
const DocsNodes = lazy(() => import('./pages/docs/nodes.mdx'));
const DocsGeneratedCode = lazy(() => import('./pages/docs/generated-code.mdx'));
const DocsTeams = lazy(() => import('./pages/docs/teams.mdx'));
const DocsBilling = lazy(() => import('./pages/docs/billing.mdx'));
const DocsResearch = lazy(() => import('./pages/docs/research.mdx'));
const DocsChangelog = lazy(() => import('./pages/docs/changelog.mdx'));
const DocsFaq = lazy(() => import('./pages/docs/faq.mdx'));

/**
 * Per-route error boundary. A bug in one route (e.g. /editor) should NOT
 * blank out the entire app — that's the top-level ErrorBoundary's job for
 * truly unrecoverable stuff (router init, auth store, etc).
 */
function RouteBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary fallback={<RouteErrorFallback />}>{children}</ErrorBoundary>
  );
}

export default function App() {
  return (
    <>
      <TopLoadingBar />
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/pricing" element={<Pricing />} />

          {/* Public docs — MDX-rendered, no auth required */}
          <Route path="/docs" element={<DocsLayout />}>
            <Route index element={<DocsIndex />} />
            <Route path="nodes" element={<DocsNodes />} />
            <Route path="generated-code" element={<DocsGeneratedCode />} />
            <Route path="teams" element={<DocsTeams />} />
            <Route path="billing" element={<DocsBilling />} />
            <Route path="research" element={<DocsResearch />} />
            <Route path="changelog" element={<DocsChangelog />} />
            <Route path="faq" element={<DocsFaq />} />
          </Route>

          {/* Onboarding — authed but pre-org */}
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <Onboarding />
              </ProtectedRoute>
            }
          />

          {/* Accept invite — authed; the page itself handles unauthed redirect to login */}
          <Route
            path="/accept-invite"
            element={
              <ProtectedRoute>
                <AcceptInvite />
              </ProtectedRoute>
            }
          />

          {/* Back-compat: /dashboard bounces to active org's dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <RouteBoundary>
                  <DashboardRedirect />
                </RouteBoundary>
              </ProtectedRoute>
            }
          />

          {/* Org-scoped routes share the AppShell (sidebar) */}
          <Route
            path="/o/:orgSlug"
            element={
              <ProtectedRoute requiresOrg>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route
              path="dashboard"
              element={
                <RouteBoundary>
                  <ProjectDashboard />
                </RouteBoundary>
              }
            />
            <Route
              path="settings/team"
              element={
                <RouteBoundary>
                  <SettingsTeam />
                </RouteBoundary>
              }
            />
            <Route
              path="settings/organization"
              element={
                <RouteBoundary>
                  <SettingsOrganization />
                </RouteBoundary>
              }
            />
            <Route
              path="settings/billing"
              element={
                <RouteBoundary>
                  <SettingsBilling />
                </RouteBoundary>
              }
            />
            <Route
              path="settings/profile"
              element={
                <RouteBoundary>
                  <SettingsProfile />
                </RouteBoundary>
              }
            />
          </Route>

          {/* Editor sits outside the AppShell because it has its own chrome */}
          <Route
            path="/o/:orgSlug/editor/:projectId"
            element={
              <ProtectedRoute requiresOrg>
                <RouteBoundary>
                  <Editor />
                </RouteBoundary>
              </ProtectedRoute>
            }
          />

          {/* Code preview — also outside AppShell, custom chrome */}
          <Route
            path="/o/:orgSlug/editor/:projectId/preview"
            element={
              <ProtectedRoute requiresOrg>
                <RouteBoundary>
                  <CodePreview />
                </RouteBoundary>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Suspense>

      {/* Global soft-paywall modal */}
      <UpgradeModal />
    </>
  );
}
