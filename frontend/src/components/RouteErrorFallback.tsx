import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

/**
 * Page-level error fallback. Rendered by the per-route ErrorBoundary when a
 * route's subtree throws. The top-level ErrorBoundary still catches anything
 * higher up (auth/org loading, routing itself, etc).
 *
 * Style: matches the rest of the app's dark palette (#0b0e14 background,
 * surface card, primary accent), not the default Tailwind light theme on
 * the global ErrorBoundary fallback.
 */
export function RouteErrorFallback() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-background text-white">
      <div className="w-full max-w-md bg-surface border border-border rounded-2xl shadow-xl p-8">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 mx-auto mb-4">
          <AlertTriangle className="w-6 h-6 text-red-400" />
        </div>
        <h1 className="text-xl font-semibold text-white text-center mb-2">
          Something went wrong on this page
        </h1>
        <p className="text-sm text-white/60 text-center mb-6">
          We hit an unexpected error rendering this view. The rest of the
          app is still up — try going back to your dashboard.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="flex-1 px-4 py-2.5 rounded-lg border border-border bg-white/5 hover:bg-white/10 text-sm text-white/80 transition-colors"
          >
            Reload page
          </button>
          <Link
            to="/dashboard"
            className="flex-1 inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-white font-medium text-sm transition-colors"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
