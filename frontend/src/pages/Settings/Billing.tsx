import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { CreditCard, ExternalLink, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { useIsOwner } from '../../hooks/useRole';

interface BillingStatus {
  plan: string;
  generations_used: number;
  generations_limit: number;
  generations_reset_at: string | null;
  stripe_customer_id?: string | null;
  has_active_subscription?: boolean;
  current_period_end?: string | null;
}

function formatTimeFromNow(iso: string | null | undefined): string {
  if (!iso) return 'soon';
  const target = new Date(iso).getTime();
  if (Number.isNaN(target)) return 'soon';
  const diffMs = target - Date.now();
  if (diffMs <= 0) return 'now';
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 60) return `in ${minutes} minute${minutes === 1 ? '' : 's'}`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `in ${hours} hour${hours === 1 ? '' : 's'}`;
  const days = Math.round(hours / 24);
  if (days < 30) return `in ${days} day${days === 1 ? '' : 's'}`;
  const months = Math.round(days / 30);
  return `in ${months} month${months === 1 ? '' : 's'}`;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function PlanBadge({ plan }: { plan: string }) {
  const isPro = plan.toLowerCase() === 'pro';
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md border text-[11px] font-semibold uppercase tracking-wider ${
        isPro
          ? 'bg-primary/15 text-primary border-primary/40'
          : 'bg-white/10 text-white/60 border-white/20'
      }`}
    >
      {isPro && <Sparkles className="w-3 h-3" />}
      {plan || 'Free'}
    </span>
  );
}

export default function Billing() {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const slug = orgSlug ?? '';
  const isOwner = useIsOwner();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const loadStatus = async () => {
    if (!slug) return;
    setLoading(true);
    try {
      const { data } = await api.get<BillingStatus>(`/o/${slug}/billing/status`);
      setStatus(data);
    } catch {
      // toast handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  // Handle ?status=success / ?status=cancelled on mount
  useEffect(() => {
    const param = searchParams.get('status');
    if (param === 'success') {
      toast.success('Subscription activated! Welcome to Pro.');
      navigate(`/o/${slug}/settings/billing`, { replace: true });
      // Refresh status to reflect new plan
      void loadStatus();
    } else if (param === 'cancelled') {
      toast('Checkout cancelled.', { icon: 'ℹ️' });
      navigate(`/o/${slug}/settings/billing`, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpgrade = async () => {
    setActionLoading(true);
    try {
      const { data } = await api.post<{ url: string }>(`/o/${slug}/billing/checkout`, {});
      if (data?.url) {
        window.location.href = data.url;
      } else {
        toast.error('Could not start checkout. Try again.');
      }
    } catch (err: unknown) {
      const e = err as { response?: { status?: number } };
      if (e?.response?.status === 503) {
        toast.error('Billing is not configured yet — contact support.');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleManage = async () => {
    setActionLoading(true);
    try {
      const { data } = await api.post<{ url: string }>(`/o/${slug}/billing/portal`, {});
      if (data?.url) {
        window.location.href = data.url;
      } else {
        toast.error('Could not open billing portal.');
      }
    } catch (err: unknown) {
      const e = err as { response?: { status?: number } };
      if (e?.response?.status === 503) {
        toast.error('Billing is not configured yet — contact support.');
      } else if (e?.response?.status === 400) {
        toast.error('No active subscription yet. Upgrade first.');
      }
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-10 max-w-3xl mx-auto">
        <div className="text-white/50 text-sm">Loading billing details...</div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="p-10 max-w-3xl mx-auto">
        <div className="text-white/50 text-sm">Could not load billing information.</div>
      </div>
    );
  }

  const usedPct =
    status.generations_limit > 0
      ? Math.min(100, Math.round((status.generations_used / status.generations_limit) * 100))
      : 0;
  const planIsPro = status.plan.toLowerCase() === 'pro';

  return (
    <div className="p-10 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white tracking-tight mb-2">Billing</h1>
        <p className="text-sm text-white/60">
          Manage your workspace plan, usage, and payment method.
        </p>
      </div>

      {/* Current plan */}
      <section className="bg-surface border border-border rounded-2xl p-6 mb-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-white/40 mb-2">Current plan</div>
            <div className="flex items-center gap-3">
              <PlanBadge plan={status.plan} />
              {status.has_active_subscription && status.current_period_end && (
                <span className="text-xs text-white/50">
                  Renews on {formatDate(status.current_period_end)}
                </span>
              )}
            </div>
          </div>
          <CreditCard className="w-5 h-5 text-white/30 shrink-0" />
        </div>
      </section>

      {/* Usage */}
      <section className="bg-surface border border-border rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[11px] uppercase tracking-wider text-white/40">Usage this period</div>
          <div className="text-sm text-white/80">
            <span className="font-semibold text-white">{status.generations_used}</span>
            <span className="text-white/40"> / {status.generations_limit} generations</span>
          </div>
        </div>
        <div className="h-2 rounded-full bg-background border border-border overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-[#a3a6ff] transition-all"
            style={{ width: `${usedPct}%` }}
          />
        </div>
        <div className="mt-2 text-xs text-white/40">
          Resets {formatTimeFromNow(status.generations_reset_at)}
        </div>
      </section>

      {/* Actions */}
      {isOwner ? (
        <section className="bg-surface border border-border rounded-2xl p-6">
          {planIsPro ? (
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-base font-semibold text-white mb-1">Manage subscription</h2>
                <p className="text-sm text-white/60">
                  Update payment method, view invoices, or cancel your plan.
                </p>
              </div>
              <button
                type="button"
                onClick={handleManage}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'Opening...' : 'Manage subscription'}
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-base font-semibold text-white mb-1">Upgrade to Pro</h2>
                <p className="text-sm text-white/60">
                  Unlock 500 generations/month, unlimited team members, and priority support.
                </p>
              </div>
              <button
                type="button"
                onClick={handleUpgrade}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-white font-medium text-sm transition-colors shadow-[0_8px_24px_-8px_rgba(99,102,241,0.6)] disabled:opacity-50"
              >
                {actionLoading ? 'Opening...' : 'Upgrade to Pro'}
                <Sparkles className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </section>
      ) : (
        <section className="bg-surface border border-border rounded-2xl p-6">
          <p className="text-sm text-white/40">Only owners can manage billing.</p>
        </section>
      )}
    </div>
  );
}
