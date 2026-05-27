import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useOrgStore } from '../../store/orgStore';
import { useRole } from '../../hooks/useRole';
import { LogOut, Code2, Eye, Zap } from 'lucide-react';
import { WorkspaceSwitcher } from './WorkspaceSwitcher';
import { api } from '../../lib/api';

interface NavbarProps {
  saveStatus?: 'saved' | 'saving' | 'unsaved';
  lastSaved?: Date | null;
}

interface QuotaInfo {
  used: number;
  limit: number;
  remaining: number;
  resets_at: string | null;
  can_generate: boolean;
}

function formatResetDate(iso: string | null | undefined): string {
  if (!iso) return 'soon';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'soon';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function Navbar({ saveStatus, lastSaved }: NavbarProps = {}) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const role = useRole();
  const activeOrgSlug = useOrgStore((s) => s.activeOrgSlug);
  const [quota, setQuota] = useState<QuotaInfo | null>(null);

  // Poll generation quota every 60s for the active org.
  // Chose polling over per-generate refetch because Navbar is rendered above
  // many flows that change quota — polling avoids tightly coupling Navbar to
  // unrelated request lifecycles.
  useEffect(() => {
    if (!activeOrgSlug) return;
    let cancelled = false;
    const fetchQuota = async () => {
      try {
        const { data } = await api.get<QuotaInfo>(`/o/${activeOrgSlug}/generate/quota`);
        if (!cancelled) setQuota(data);
      } catch {
        // silent — chip just disappears
      }
    };
    void fetchQuota();
    const id = window.setInterval(fetchQuota, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [activeOrgSlug]);

  // Only show the chip for the currently active org by tying display to the slug.
  const showQuota = Boolean(activeOrgSlug && quota);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const dashboardHref = activeOrgSlug ? `/o/${activeOrgSlug}/dashboard` : '/dashboard';
  const billingHref = activeOrgSlug ? `/o/${activeOrgSlug}/settings/billing` : '/dashboard';

  return (
    <nav className="h-16 border-b border-border bg-surface/50 backdrop-blur-md sticky top-0 z-50 px-6 flex flex-row items-center justify-between">
      <div className="flex items-center gap-4">
        <Link to={dashboardHref} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="bg-primary/20 p-1.5 rounded-lg">
            <Code2 className="w-5 h-5 text-primary" />
          </div>
          <span className="font-bold text-lg tracking-wide">Anvaya</span>
        </Link>

        <WorkspaceSwitcher />

        {showQuota && quota && (
          <button
            type="button"
            onClick={() => navigate(billingHref)}
            title={`Resets ${formatResetDate(quota.resets_at)}`}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-white/10 bg-white/5 hover:bg-white/10 text-[11px] text-white/60 hover:text-white/90 transition-colors"
          >
            <Zap className="w-3 h-3" />
            {quota.used} / {quota.limit} generations
          </button>
        )}
      </div>

      <div className="flex items-center gap-6 text-sm">
        {role === 'viewer' && (
          <span className="flex items-center gap-1.5 px-2 py-1 rounded-md border border-white/15 bg-white/5 text-[11px] text-white/70 font-medium">
            <Eye className="w-3 h-3" />
            View-only
          </span>
        )}

        {/* Save status indicator */}
        {saveStatus && (
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <div className={`w-2 h-2 rounded-full ${
              saveStatus === 'saved' ? 'bg-green-400' :
              saveStatus === 'saving' ? 'bg-yellow-400' : 'bg-red-400'
            }`} />
            {saveStatus === 'saved' && lastSaved && (
              <span>Saved {lastSaved.toLocaleTimeString()}</span>
            )}
            {saveStatus === 'saving' && <span>Saving...</span>}
            {saveStatus === 'unsaved' && <span>Unsaved changes</span>}
          </div>
        )}

        <div className="flex flex-col items-end">
          <span className="font-medium text-white/90">{user?.name}</span>
          <span className="text-white/50 text-xs">
            {user?.generations_limit && user.generations_limit - user.generations_used} credits left
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          title="Log out"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </nav>
  );
}
