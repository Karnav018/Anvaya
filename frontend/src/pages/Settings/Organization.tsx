import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { useOrgStore } from '../../store/orgStore';
import { useIsOwner } from '../../hooks/useRole';
import { Button } from '../../components/ui/Button';

interface OrgDetails {
  id: string;
  slug: string;
  name: string;
  plan?: string;
}

export default function Organization() {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const slug = orgSlug ?? '';
  const isOwner = useIsOwner();
  const navigate = useNavigate();
  const refreshOrgs = useOrgStore((s) => s.refresh);
  const orgs = useOrgStore((s) => s.orgs);
  const setActiveOrg = useOrgStore((s) => s.setActiveOrg);

  const [org, setOrg] = useState<OrgDetails | null>(null);
  const [name, setName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [saving, setSaving] = useState(false);

  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get<OrgDetails>(`/orgs/${slug}`);
        if (cancelled) return;
        setOrg(data);
        setName(data.name);
        setNewSlug(data.slug);
      } catch {
        /* toast handled */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!org) return;
    setSaving(true);
    const trimmedName = name.trim();
    const trimmedSlug = newSlug.trim();
    const payload: { name?: string; slug?: string } = {};
    if (trimmedName !== org.name) payload.name = trimmedName;
    if (trimmedSlug !== org.slug) payload.slug = trimmedSlug;
    if (Object.keys(payload).length === 0) {
      toast('No changes to save', { icon: 'ℹ️' });
      setSaving(false);
      return;
    }
    try {
      const { data } = await api.patch<OrgDetails>(`/orgs/${slug}`, payload);
      toast.success('Workspace updated');
      await refreshOrgs();
      if (payload.slug && data.slug !== slug) {
        setActiveOrg(data.slug);
        navigate(`/o/${data.slug}/settings/organization`, { replace: true });
      } else {
        setOrg(data);
      }
    } catch {
      /* toast handled */
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!org) return;
    if (confirmText !== org.slug) {
      toast.error('Type the slug to confirm deletion');
      return;
    }
    setDeleting(true);
    try {
      await api.delete(`/orgs/${slug}`);
      toast.success('Workspace deleted');
      await refreshOrgs();
      const fallback = orgs.find((o) => o.slug !== slug);
      if (fallback) {
        setActiveOrg(fallback.slug);
        navigate(`/o/${fallback.slug}/dashboard`, { replace: true });
      } else {
        navigate('/onboarding', { replace: true });
      }
    } catch {
      /* toast handled */
    } finally {
      setDeleting(false);
    }
  };

  if (!org) {
    return (
      <div className="p-10 max-w-3xl mx-auto">
        <div className="text-white/50 text-sm">Loading...</div>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="p-10 max-w-3xl mx-auto">
        <h1 className="text-3xl font-black text-white tracking-tight mb-2">Workspace</h1>
        <p className="text-sm text-white/60 mb-6">Only owners can change workspace settings.</p>
        <section className="bg-surface border border-border rounded-2xl p-6 space-y-3">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-white/40 mb-1">Name</div>
            <div className="text-white">{org.name}</div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-white/40 mb-1">Slug</div>
            <div className="text-white font-mono text-sm">{org.slug}</div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="p-10 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white tracking-tight mb-2">Workspace</h1>
        <p className="text-sm text-white/60">Manage settings for this workspace.</p>
      </div>

      <form onSubmit={handleSave} className="bg-surface border border-border rounded-2xl p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">Name</label>
          <input
            type="text"
            required
            minLength={2}
            maxLength={80}
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={saving}
            className="w-full px-4 py-2.5 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-white disabled:opacity-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">Slug</label>
          <input
            type="text"
            required
            pattern="[a-z0-9-]+"
            minLength={2}
            maxLength={40}
            value={newSlug}
            onChange={(e) => setNewSlug(e.target.value.toLowerCase())}
            disabled={saving}
            className="w-full px-4 py-2.5 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-white font-mono text-sm disabled:opacity-50"
          />
          <p className="text-xs text-yellow-400/80 mt-2 flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3" />
            Changing the slug breaks any bookmarked URLs for this workspace.
          </p>
        </div>

        <div className="flex justify-end">
          <Button type="submit" variant="primary" loading={saving}>
            Save changes
          </Button>
        </div>
      </form>

      <section className="mt-10 bg-surface border border-red-500/30 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-red-400 mb-2">Danger zone</h2>
        <p className="text-sm text-white/60 mb-4">
          Permanently delete this workspace. All projects, blueprints, and members will be removed.
        </p>
        <label className="block text-xs text-white/60 mb-2">
          Type <span className="font-mono text-white/80">{org.slug}</span> to confirm:
        </label>
        <input
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          disabled={deleting}
          placeholder={org.slug}
          className="w-full px-4 py-2.5 rounded-xl bg-background border border-border focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all text-white font-mono text-sm mb-3 disabled:opacity-50"
        />
        <Button
          type="button"
          variant="danger"
          onClick={handleDelete}
          loading={deleting}
          disabled={confirmText !== org.slug}
        >
          Delete workspace
        </Button>
      </section>
    </div>
  );
}
