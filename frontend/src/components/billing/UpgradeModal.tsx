import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Sparkles, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal } from '../ui/Modal';
import { api } from '../../lib/api';
import { useUIStore } from '../../store/uiStore';
import { useOrgStore } from '../../store/orgStore';
import { useIsOwner } from '../../hooks/useRole';

export function UpgradeModal() {
  const open = useUIStore((s) => s.upgradeOpen);
  const reason = useUIStore((s) => s.upgradeReason);
  const close = useUIStore((s) => s.closeUpgrade);
  const activeOrgSlug = useOrgStore((s) => s.activeOrgSlug);
  const isOwner = useIsOwner();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    if (!activeOrgSlug) {
      toast.error('Select a workspace first.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post<{ url: string }>(
        `/o/${activeOrgSlug}/billing/checkout`,
        {}
      );
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
      setLoading(false);
    }
  };

  const proFeatures = [
    '500 generations per month',
    'Unlimited team members',
    'Workspaces & roles',
    'Billing portal',
    'Priority support',
  ];

  return (
    <Modal isOpen={open} onClose={close} size="md">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-primary/15 border border-primary/30">
            <Zap className="w-4 h-4 text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-white">
            You&apos;ve hit your monthly limit
          </h2>
        </div>

        <p className="text-sm text-white/60 mb-5">
          {reason ??
            'Free workspaces are capped at 10 generations per month. Upgrade to Pro to keep building.'}
        </p>

        <div className="bg-background border border-border rounded-xl p-5 mb-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-white">Pro plan</span>
            </div>
            <div>
              <span className="text-2xl font-black text-white">$29</span>
              <span className="text-xs text-white/40 ml-1">/ user / month</span>
            </div>
          </div>
          <ul className="space-y-2">
            {proFeatures.map((feat) => (
              <li key={feat} className="flex items-start gap-2 text-sm text-white/80">
                <Check className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                <span>{feat}</span>
              </li>
            ))}
          </ul>
        </div>

        {isOwner ? (
          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={close}
              className="px-4 py-2 text-sm text-white/60 hover:text-white transition-colors"
            >
              Not now
            </button>
            <button
              type="button"
              onClick={handleUpgrade}
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-white font-medium text-sm transition-colors shadow-[0_8px_24px_-8px_rgba(99,102,241,0.6)] disabled:opacity-50"
            >
              {loading ? 'Opening...' : 'Upgrade to Pro'}
              <Sparkles className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-white/50">
              Ask your workspace owner to upgrade.
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={close}
                className="px-4 py-2 text-sm text-white/60 hover:text-white transition-colors"
              >
                Close
              </button>
              <Link
                to="/pricing"
                onClick={close}
                className="px-4 py-2 text-sm text-white/80 border border-border rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                View plans
              </Link>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
