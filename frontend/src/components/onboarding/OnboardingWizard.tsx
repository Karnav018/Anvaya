import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Building2, Users, LayoutTemplate, FileCode2, ShoppingCart, BookText, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { useOrgStore, type Org } from '../../store/orgStore';
import type { Project } from '../../lib/types';
import { TEMPLATE_LIST, type TemplateKey } from '../../lib/canvasTemplates';

type Step = 1 | 2 | 3;

interface InviteStatus {
  email: string;
  status: 'pending' | 'sending' | 'sent' | 'error';
  error?: string;
}

const TEMPLATE_ICONS: Record<TemplateKey, typeof FileCode2> = {
  todo: FileCode2,
  cart: ShoppingCart,
  blog: BookText,
};

const TRANSITION = { duration: 0.2 };

export function OnboardingWizard() {
  const navigate = useNavigate();
  const refresh = useOrgStore((s) => s.refresh);
  const setActiveOrg = useOrgStore((s) => s.setActiveOrg);

  const [step, setStep] = useState<Step>(1);
  const [direction, setDirection] = useState<1 | -1>(1);

  // Step 1 state
  const [orgName, setOrgName] = useState('');
  const [orgSlug, setOrgSlug] = useState<string | null>(null);
  const [creatingOrg, setCreatingOrg] = useState(false);

  // Step 2 state
  const [inviteEmails, setInviteEmails] = useState('');
  const [inviteStatuses, setInviteStatuses] = useState<InviteStatus[]>([]);
  const [sendingInvites, setSendingInvites] = useState(false);

  // Step 3 state
  const [creatingProject, setCreatingProject] = useState<string | null>(null);

  const goTo = (next: Step) => {
    setDirection(next > step ? 1 : -1);
    setStep(next);
  };

  // ---------- Step 1 ----------
  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = orgName.trim();
    if (!trimmed) return;
    setCreatingOrg(true);
    try {
      const { data } = await api.post<Org>('/orgs', { name: trimmed });
      await refresh();
      setActiveOrg(data.slug);
      setOrgSlug(data.slug);
      toast.success(`Workspace "${data.name}" created`);
      goTo(2);
    } catch {
      // toast handled by interceptor
    } finally {
      setCreatingOrg(false);
    }
  };

  // ---------- Step 2 ----------
  const parseEmails = (raw: string): string[] => {
    return raw
      .split(/[,\n]/)
      .map((s) => s.trim().toLowerCase())
      .filter((s) => s.length > 0);
  };

  const handleSendInvites = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgSlug) return;
    const emails = parseEmails(inviteEmails);
    if (emails.length === 0) {
      goTo(3);
      return;
    }
    setSendingInvites(true);
    const initial: InviteStatus[] = emails.map((email) => ({ email, status: 'pending' }));
    setInviteStatuses(initial);

    for (let i = 0; i < emails.length; i++) {
      const email = emails[i];
      setInviteStatuses((prev) =>
        prev.map((s, idx) => (idx === i ? { ...s, status: 'sending' } : s)),
      );
      try {
        await api.post(`/o/${orgSlug}/invitations`, { email, role: 'editor' });
        setInviteStatuses((prev) =>
          prev.map((s, idx) => (idx === i ? { ...s, status: 'sent' } : s)),
        );
      } catch (err: unknown) {
        const message =
          (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
          'Failed';
        setInviteStatuses((prev) =>
          prev.map((s, idx) =>
            idx === i ? { ...s, status: 'error', error: message } : s,
          ),
        );
      }
    }
    setSendingInvites(false);
    // Auto-advance after a brief pause so the user can see the results.
    setTimeout(() => goTo(3), 600);
  };

  const handleSkipInvites = () => {
    setInviteStatuses([]);
    goTo(3);
  };

  // ---------- Step 3 ----------
  const handlePickTemplate = async (templateKey: TemplateKey | null, label: string) => {
    if (!orgSlug) return;
    setCreatingProject(templateKey ?? 'empty');
    try {
      const payload: { name: string; template?: TemplateKey } = { name: label };
      if (templateKey) payload.template = templateKey;
      const { data } = await api.post<Project>(`/o/${orgSlug}/projects`, payload);
      toast.success('Project created');
      navigate(`/o/${orgSlug}/editor/${data.id}`, { replace: true });
    } catch {
      // toast already shown by interceptor
    } finally {
      setCreatingProject(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
      <div className="bg-surface border border-border rounded-2xl p-8 max-w-lg w-full shadow-2xl relative overflow-hidden">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className={`h-1.5 rounded-full transition-all ${
                step === n ? 'w-8 bg-primary' : n < step ? 'w-4 bg-primary/60' : 'w-4 bg-border'
              }`}
            />
          ))}
        </div>

        <div className="relative min-h-[320px]">
          <AnimatePresence mode="wait" initial={false} custom={direction}>
            {step === 1 && (
              <motion.div
                key="step-1"
                custom={direction}
                initial={{ opacity: 0, x: direction * 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -direction * 16 }}
                transition={TRANSITION}
              >
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/15 mb-3">
                    <Building2 className="w-6 h-6 text-primary" />
                  </div>
                  <h1 className="text-2xl font-bold text-white mb-1">Name your workspace</h1>
                  <p className="text-white/60 text-sm">You can change this any time.</p>
                </div>
                <form onSubmit={handleCreateOrg} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Workspace name
                    </label>
                    <input
                      type="text"
                      required
                      autoFocus
                      minLength={2}
                      maxLength={60}
                      disabled={creatingOrg}
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      placeholder="e.g. Acme Inc."
                      className="w-full px-4 py-2.5 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-white disabled:opacity-50"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={creatingOrg || orgName.trim().length < 2}
                    className="w-full py-3 mt-2 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
                  >
                    {creatingOrg ? 'Creating...' : 'Create workspace'}
                  </button>
                </form>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step-2"
                custom={direction}
                initial={{ opacity: 0, x: direction * 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -direction * 16 }}
                transition={TRANSITION}
              >
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/15 mb-3">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <h1 className="text-2xl font-bold text-white mb-1">Invite teammates</h1>
                  <p className="text-white/60 text-sm">
                    Comma-separated emails. They'll join as editors. You can skip this.
                  </p>
                </div>
                <form onSubmit={handleSendInvites} className="space-y-4">
                  <textarea
                    rows={3}
                    disabled={sendingInvites}
                    value={inviteEmails}
                    onChange={(e) => setInviteEmails(e.target.value)}
                    placeholder="alice@company.com, bob@company.com"
                    className="w-full px-4 py-2.5 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-white disabled:opacity-50 resize-none"
                  />

                  {inviteStatuses.length > 0 && (
                    <ul className="space-y-1 max-h-32 overflow-y-auto text-xs">
                      {inviteStatuses.map((s) => (
                        <li
                          key={s.email}
                          className="flex justify-between items-center px-3 py-1.5 rounded bg-background/60 border border-border/50"
                        >
                          <span className="text-white/80 truncate">{s.email}</span>
                          <span
                            className={
                              s.status === 'sent'
                                ? 'text-green-400'
                                : s.status === 'error'
                                  ? 'text-red-400'
                                  : s.status === 'sending'
                                    ? 'text-yellow-400'
                                    : 'text-white/40'
                            }
                          >
                            {s.status === 'sent'
                              ? 'Invited'
                              : s.status === 'error'
                                ? s.error ?? 'Failed'
                                : s.status === 'sending'
                                  ? 'Sending...'
                                  : 'Queued'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleSkipInvites}
                      disabled={sendingInvites}
                      className="flex-1 py-3 bg-transparent border border-border hover:bg-white/5 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
                    >
                      Skip
                    </button>
                    <button
                      type="submit"
                      disabled={sendingInvites || inviteEmails.trim().length === 0}
                      className="flex-1 py-3 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
                    >
                      {sendingInvites ? 'Sending...' : 'Send invites'}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step-3"
                custom={direction}
                initial={{ opacity: 0, x: direction * 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -direction * 16 }}
                transition={TRANSITION}
              >
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/15 mb-3">
                    <LayoutTemplate className="w-6 h-6 text-primary" />
                  </div>
                  <h1 className="text-2xl font-bold text-white mb-1">Start with a template</h1>
                  <p className="text-white/60 text-sm">
                    We'll create a project and prefill your canvas.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {TEMPLATE_LIST.map((t) => {
                    const Icon = TEMPLATE_ICONS[t.key];
                    const isBusy = creatingProject === t.key;
                    return (
                      <button
                        key={t.key}
                        type="button"
                        disabled={creatingProject !== null}
                        onClick={() => handlePickTemplate(t.key, t.name)}
                        className="text-left p-4 rounded-xl bg-background border border-border hover:border-primary/60 hover:bg-background/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                      >
                        <Icon className="w-5 h-5 text-primary mb-2" />
                        <div className="text-sm font-semibold text-white mb-0.5">{t.name}</div>
                        <div className="text-[11px] text-white/50 leading-snug">
                          {isBusy ? 'Creating...' : t.description}
                        </div>
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    disabled={creatingProject !== null}
                    onClick={() => handlePickTemplate(null, 'New project')}
                    className="text-left p-4 rounded-xl bg-background border border-dashed border-border hover:border-primary/60 hover:bg-background/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed col-span-2"
                  >
                    <FileText className="w-5 h-5 text-white/60 mb-2" />
                    <div className="text-sm font-semibold text-white mb-0.5">Empty canvas</div>
                    <div className="text-[11px] text-white/50 leading-snug">
                      {creatingProject === 'empty' ? 'Creating...' : 'Build from scratch'}
                    </div>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
