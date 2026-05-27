import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Check, Plus, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { useOrgStore, type Org, type OrgRole } from '../../store/orgStore';
import { api } from '../../lib/api';

function RoleBadge({ role }: { role: OrgRole }) {
  const styles: Record<OrgRole, string> = {
    owner: 'bg-[#a3a6ff]/15 text-[#a3a6ff] border-[#a3a6ff]/30',
    editor: 'bg-emerald-400/15 text-emerald-300 border-emerald-400/30',
    viewer: 'bg-white/10 text-white/60 border-white/20',
  };
  return (
    <span
      className={`px-1.5 py-0.5 rounded-md border text-[10px] font-semibold uppercase tracking-wider ${styles[role]}`}
    >
      {role}
    </span>
  );
}

export function WorkspaceSwitcher() {
  const navigate = useNavigate();
  const orgs = useOrgStore((s) => s.orgs);
  const activeOrgSlug = useOrgStore((s) => s.activeOrgSlug);
  const setActiveOrg = useOrgStore((s) => s.setActiveOrg);
  const refresh = useOrgStore((s) => s.refresh);

  const [open, setOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const active: Org | undefined = orgs.find((o) => o.slug === activeOrgSlug);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
        setShowCreate(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const handleSelect = (org: Org) => {
    setActiveOrg(org.slug);
    setOpen(false);
    setShowCreate(false);
    navigate(`/o/${org.slug}/dashboard`);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setCreating(true);
    try {
      const { data } = await api.post<Org & { my_role?: OrgRole }>('/orgs', { name: trimmed });
      await refresh();
      setActiveOrg(data.slug);
      toast.success(`Workspace "${data.name}" created`);
      setName('');
      setShowCreate(false);
      setOpen(false);
      navigate(`/o/${data.slug}/dashboard`);
    } catch {
      // toast handled by api interceptor
    } finally {
      setCreating(false);
    }
  };

  if (orgs.length === 0 && !active) {
    return null;
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-[#1e1e2e] bg-[#161a21] hover:bg-[#1c2028] transition-colors max-w-[260px]"
      >
        <Building2 className="w-4 h-4 text-[#a3a6ff] shrink-0" />
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-medium text-white/90 truncate">
            {active?.name ?? 'Select workspace'}
          </span>
          {active && <RoleBadge role={active.role} />}
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-white/40 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-[#161a21] border border-[#1e1e2e] rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="px-3 pt-3 pb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
              Workspaces
            </span>
          </div>
          <ul className="max-h-64 overflow-y-auto block-scrollbar pb-1">
            {orgs.map((org) => {
              const isActive = org.slug === activeOrgSlug;
              return (
                <li key={org.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(org)}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-left transition-colors ${
                      isActive ? 'bg-[#1c2028]' : 'hover:bg-[#1c2028]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-md bg-[#1c2028] border border-[#22262f] flex items-center justify-center shrink-0">
                        <Building2 className="w-3.5 h-3.5 text-[#a3a6ff]" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[13px] font-medium text-white truncate">{org.name}</span>
                        <span className="text-[10px] text-white/40 truncate">/{org.slug}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <RoleBadge role={org.role} />
                      {isActive && <Check className="w-3.5 h-3.5 text-[#a3a6ff]" />}
                    </div>
                  </button>
                </li>
              );
            })}
            {orgs.length === 0 && (
              <li className="px-3 py-4 text-[12px] text-white/50 text-center">
                No workspaces yet
              </li>
            )}
          </ul>

          <div className="border-t border-[#1e1e2e]">
            {showCreate ? (
              <form onSubmit={handleCreate} className="p-3 space-y-2">
                <label className="block text-[11px] font-medium text-white/60">
                  New workspace name
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  disabled={creating}
                  minLength={2}
                  maxLength={60}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Acme Inc."
                  className="w-full px-3 py-1.5 text-sm rounded-lg bg-[#0a0a0f] border border-[#1e1e2e] focus:border-[#a3a6ff]/60 focus:ring-1 focus:ring-[#a3a6ff]/30 outline-none transition-all text-white"
                />
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreate(false);
                      setName('');
                    }}
                    disabled={creating}
                    className="px-2.5 py-1 text-[12px] text-white/60 hover:text-white rounded-md transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-2.5 py-1 text-[12px] bg-[#a3a6ff] text-[#0f00a4] font-semibold rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {creating ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-[13px] text-white/80 hover:text-white hover:bg-[#1c2028] transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-[#a3a6ff]" />
                Create workspace
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
