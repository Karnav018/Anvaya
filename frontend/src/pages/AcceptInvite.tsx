import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { useOrgStore } from '../store/orgStore';

type Status = 'idle' | 'loading' | 'success' | 'error';

interface AcceptResponse {
  organization: { slug: string; name: string };
  role: string;
}

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const access = useAuthStore((s) => s.access);
  const navigate = useNavigate();
  const refresh = useOrgStore((s) => s.refresh);
  const setActiveOrg = useOrgStore((s) => s.setActiveOrg);

  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const calledRef = useRef(false);

  useEffect(() => {
    if (!access || !token) return;
    if (calledRef.current) return;
    calledRef.current = true;

    (async () => {
      setStatus('loading');
      try {
        const { data } = await api.post<AcceptResponse>('/invitations/accept', { token });
        toast.success(`Joined ${data.organization.name}!`);
        await refresh();
        setActiveOrg(data.organization.slug);
        setStatus('success');
        navigate(`/o/${data.organization.slug}/dashboard`, { replace: true });
      } catch (err) {
        const e = err as { response?: { status?: number; data?: { detail?: string } } };
        const detail = e?.response?.data?.detail;
        if (e?.response?.status === 400) {
          setErrorMessage('This invite link is invalid or expired.');
        } else {
          setErrorMessage(detail || 'Could not accept the invitation.');
        }
        setStatus('error');
      }
    })();
  }, [access, token, navigate, refresh, setActiveOrg]);

  if (!access) {
    const next = `/accept-invite?token=${encodeURIComponent(token)}`;
    return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />;
  }

  if (!token) {
    return (
      <CardShell>
        <div className="flex flex-col items-center text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
          <h1 className="text-xl font-semibold text-white mb-1">Missing invite token</h1>
          <p className="text-white/60 text-sm mb-6">
            This link doesn't include an invitation token.
          </p>
          <Link
            to="/dashboard"
            className="px-4 py-2 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl transition-colors"
          >
            Back to dashboard
          </Link>
        </div>
      </CardShell>
    );
  }

  return (
    <CardShell>
      {status === 'loading' || status === 'idle' ? (
        <div className="text-center">
          <div className="w-10 h-10 rounded-full border-2 border-white/10 border-t-primary animate-spin mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-white mb-1">Joining workspace...</h1>
          <p className="text-white/60 text-sm">Please wait a moment.</p>
        </div>
      ) : status === 'success' ? (
        <div className="text-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
          <h1 className="text-xl font-semibold text-white mb-1">You're in!</h1>
          <p className="text-white/60 text-sm">Redirecting to your new workspace...</p>
        </div>
      ) : (
        <div className="text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <h1 className="text-xl font-semibold text-white mb-1">Invite unavailable</h1>
          <p className="text-white/60 text-sm mb-6">{errorMessage}</p>
          <Link
            to="/dashboard"
            className="inline-block px-4 py-2 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl transition-colors"
          >
            Back to dashboard
          </Link>
        </div>
      )}
    </CardShell>
  );
}

function CardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="w-full max-w-md bg-surface border border-border p-8 rounded-2xl shadow-xl relative z-10">
        {children}
      </div>
    </div>
  );
}
