import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Code2, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { useOrgStore } from '../store/orgStore';

interface PlanCardProps {
  name: string;
  price: string;
  cadence: string;
  description: string;
  features: string[];
  ctaLabel: string;
  onCtaClick: () => void;
  ctaLoading?: boolean;
  highlighted?: boolean;
}

function PlanCard({
  name,
  price,
  cadence,
  description,
  features,
  ctaLabel,
  onCtaClick,
  ctaLoading,
  highlighted,
}: PlanCardProps) {
  return (
    <div
      className={`relative flex flex-col bg-surface rounded-2xl p-8 border transition-all ${
        highlighted
          ? 'border-primary/50 shadow-[0_0_60px_-15px_rgba(99,102,241,0.45)]'
          : 'border-border'
      }`}
    >
      {highlighted && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/15 text-primary border border-primary/40 text-[11px] font-semibold uppercase tracking-wider">
          <Sparkles className="w-3 h-3" />
          Most popular
        </span>
      )}

      <div className="mb-6">
        <h3 className="text-xl font-semibold text-white">{name}</h3>
        <p className="text-sm text-white/50 mt-1">{description}</p>
      </div>

      <div className="mb-6">
        <span className="text-4xl font-black text-white tracking-tight">{price}</span>
        <span className="text-sm text-white/40 ml-1">{cadence}</span>
      </div>

      <ul className="space-y-3 mb-8 flex-1">
        {features.map((feat) => (
          <li key={feat} className="flex items-start gap-2.5 text-sm text-white/80">
            <Check className={`w-4 h-4 mt-0.5 shrink-0 ${highlighted ? 'text-primary' : 'text-white/40'}`} />
            <span>{feat}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onCtaClick}
        disabled={ctaLoading}
        className={`w-full py-3 rounded-xl font-medium transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
          highlighted
            ? 'bg-primary hover:bg-primary/90 text-white shadow-[0_8px_24px_-8px_rgba(99,102,241,0.6)]'
            : 'bg-white/5 hover:bg-white/10 text-white border border-border'
        }`}
      >
        {ctaLoading ? 'Loading...' : ctaLabel}
      </button>
    </div>
  );
}

export default function Pricing() {
  const navigate = useNavigate();
  const access = useAuthStore((s) => s.access);
  const activeOrgSlug = useOrgStore((s) => s.activeOrgSlug);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const isAuthed = Boolean(access);

  const handleFreeCta = () => {
    if (!isAuthed) {
      navigate('/signup');
      return;
    }
    if (activeOrgSlug) {
      navigate(`/o/${activeOrgSlug}/dashboard`);
    } else {
      navigate('/dashboard');
    }
  };

  const handleProCta = async () => {
    if (!isAuthed) {
      navigate('/signup?next=/pricing');
      return;
    }
    if (!activeOrgSlug) {
      toast.error('Select a workspace first.');
      navigate('/dashboard');
      return;
    }
    setCheckoutLoading(true);
    try {
      const { data } = await api.post<{ url: string }>(`/o/${activeOrgSlug}/billing/checkout`, {});
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
      // other errors handled by api interceptor
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-white relative overflow-hidden">
      {/* Radial background glow */}
      <div className="pointer-events-none absolute top-[-200px] left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/15 blur-[140px] rounded-full" />

      <header className="relative z-10 px-6 py-5 flex items-center justify-between max-w-6xl mx-auto">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="bg-primary/20 p-1.5 rounded-lg">
            <Code2 className="w-5 h-5 text-primary" />
          </div>
          <span className="font-bold text-lg tracking-wide">Anvaya</span>
        </Link>

        <div className="flex items-center gap-4 text-sm">
          {isAuthed ? (
            <Link
              to={activeOrgSlug ? `/o/${activeOrgSlug}/dashboard` : '/dashboard'}
              className="text-white/70 hover:text-white transition-colors"
            >
              Go to dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="text-white/70 hover:text-white transition-colors">
                Log in
              </Link>
              <Link
                to="/signup"
                className="px-4 py-2 bg-primary hover:bg-primary/90 rounded-lg font-medium transition-colors"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-6 pt-16 pb-24">
        <div className="text-center mb-14 max-w-2xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-white/60 text-lg">
            Build APIs visually. Pay only when you scale beyond the free tier.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <PlanCard
            name="Free"
            price="$0"
            cadence="/ month"
            description="For tinkering and side projects."
            features={[
              '10 generations per month',
              '1 user',
              'Unlimited canvases',
              'Community support',
            ]}
            ctaLabel="Start free"
            onCtaClick={handleFreeCta}
          />
          <PlanCard
            name="Pro"
            price="$29"
            cadence="/ user / month"
            description="For teams shipping production APIs."
            features={[
              '500 generations per month',
              'Unlimited team members',
              'Workspaces & roles',
              'Billing portal',
              'Priority support',
            ]}
            ctaLabel="Start 14-day trial"
            onCtaClick={handleProCta}
            ctaLoading={checkoutLoading}
            highlighted
          />
        </div>

        <div className="mt-12 text-center text-sm text-white/40">
          Enterprise — SSO, audit logs, on-prem available.{' '}
          <a
            href="mailto:sales@anvaya.dev?subject=Enterprise%20inquiry"
            className="text-white/60 hover:text-white underline underline-offset-2 transition-colors"
          >
            Talk to us
          </a>
          .
        </div>
      </main>
    </div>
  );
}
