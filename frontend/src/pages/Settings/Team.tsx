import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { UserPlus, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { useOrgStore, type OrgRole } from '../../store/orgStore';
import { useIsOwner } from '../../hooks/useRole';
import { MembersTable, type Member } from '../../components/team/MembersTable';
import { InviteMemberModal } from '../../components/team/InviteMemberModal';
import { ConfirmModal } from '../../components/ui/ConfirmModal';

interface Invitation {
  id: string;
  email: string;
  role: OrgRole;
  created_at?: string;
  expires_at?: string;
}

export default function Team() {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const slug = orgSlug ?? '';
  const currentUser = useAuthStore((s) => s.user);
  const isOwner = useIsOwner();
  const refreshOrgs = useOrgStore((s) => s.refresh);

  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);

  const [confirmDemoteOpen, setConfirmDemoteOpen] = useState(false);
  const [pendingDemote, setPendingDemote] = useState<{ member: Member; role: OrgRole } | null>(null);

  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);
  const [pendingRemove, setPendingRemove] = useState<Member | null>(null);

  const loadMembers = async () => {
    if (!slug) return;
    setLoading(true);
    try {
      const { data } = await api.get<Member[]>(`/orgs/${slug}/members`);
      setMembers(data);
    } catch {
      // toast handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  const loadInvitations = async () => {
    if (!slug || !isOwner) return;
    try {
      const { data } = await api.get<Invitation[]>(`/orgs/${slug}/invitations`);
      setInvitations(Array.isArray(data) ? data : []);
    } catch {
      // If the backend doesn't expose a GET endpoint yet, swallow silently
      // — see follow-up note in the report.
      setInvitations(null);
    }
  };

  useEffect(() => {
    void loadMembers();
    void loadInvitations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const ownersCount = members.filter((m) => m.role === 'owner').length;

  const applyRoleChange = async (member: Member, role: OrgRole) => {
    try {
      await api.patch(`/orgs/${slug}/members/${member.user_id}`, { role });
      toast.success(`Updated ${member.email}'s role to ${role}`);
      await loadMembers();
      // If we changed our own role, refresh org list so role hooks update.
      if (currentUser?.id === member.user_id) {
        await refreshOrgs();
      }
    } catch {
      // toast handled
    }
  };

  const handleRoleChange = (member: Member, role: OrgRole) => {
    if (member.role === role) return;
    const isSelf = currentUser?.id === member.user_id;
    const isSoleOwner = member.role === 'owner' && ownersCount <= 1;
    if (isSelf && isSoleOwner && role !== 'owner') {
      setPendingDemote({ member, role });
      setConfirmDemoteOpen(true);
      return;
    }
    void applyRoleChange(member, role);
  };

  const handleRemove = (member: Member) => {
    setPendingRemove(member);
    setConfirmRemoveOpen(true);
  };

  const confirmRemove = async () => {
    if (!pendingRemove) return;
    try {
      await api.delete(`/orgs/${slug}/members/${pendingRemove.user_id}`);
      toast.success(`Removed ${pendingRemove.email}`);
      if (currentUser?.id === pendingRemove.user_id) {
        await refreshOrgs();
      } else {
        await loadMembers();
      }
    } catch {
      // toast handled
    } finally {
      setPendingRemove(null);
    }
  };

  const confirmDemote = async () => {
    if (!pendingDemote) return;
    await applyRoleChange(pendingDemote.member, pendingDemote.role);
    setPendingDemote(null);
  };

  return (
    <div className="p-10 max-w-5xl mx-auto">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight mb-2">Team</h1>
          <p className="text-sm text-white/60">
            Manage who has access to this workspace and what they can do.
          </p>
        </div>
        {isOwner && (
          <button
            type="button"
            onClick={() => setInviteOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors font-medium text-sm"
          >
            <UserPlus className="w-4 h-4" />
            Invite member
          </button>
        )}
      </div>

      <section className="bg-surface border border-border rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border/50">
          <h2 className="text-sm font-semibold text-white">Members ({members.length})</h2>
        </div>
        {loading ? (
          <div className="px-4 py-12 text-center text-white/50 text-sm">Loading members...</div>
        ) : (
          <MembersTable
            members={members}
            currentUserId={currentUser?.id ?? null}
            canManage={isOwner}
            onRoleChange={handleRoleChange}
            onRemove={handleRemove}
          />
        )}
      </section>

      {isOwner && invitations && invitations.length > 0 && (
        <section className="mt-8 bg-surface border border-border rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border/50">
            <h2 className="text-sm font-semibold text-white">
              Pending invitations ({invitations.length})
            </h2>
          </div>
          <ul className="divide-y divide-border/30">
            {invitations.map((inv) => (
              <li key={inv.id} className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-white/40" />
                  <div className="flex flex-col">
                    <span className="text-sm text-white/90">{inv.email}</span>
                    <span className="text-[11px] text-white/40 capitalize">{inv.role}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await api.delete(`/orgs/${slug}/invitations/${inv.id}`);
                      toast.success('Invitation revoked');
                      await loadInvitations();
                    } catch {
                      /* toast handled */
                    }
                  }}
                  className="text-xs text-white/50 hover:text-red-400 transition-colors"
                >
                  Revoke
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <InviteMemberModal
        isOpen={inviteOpen}
        onClose={() => setInviteOpen(false)}
        orgSlug={slug}
        onSuccess={loadInvitations}
      />

      <ConfirmModal
        isOpen={confirmDemoteOpen}
        onClose={() => {
          setConfirmDemoteOpen(false);
          setPendingDemote(null);
        }}
        onConfirm={confirmDemote}
        title="Demote yourself?"
        message="You are the only owner of this workspace. If you change your role, no one will be able to manage the org. Are you sure?"
        confirmText="Demote me"
      />

      <ConfirmModal
        isOpen={confirmRemoveOpen}
        onClose={() => {
          setConfirmRemoveOpen(false);
          setPendingRemove(null);
        }}
        onConfirm={confirmRemove}
        title={pendingRemove?.user_id === currentUser?.id ? 'Leave workspace?' : 'Remove member?'}
        message={
          pendingRemove?.user_id === currentUser?.id
            ? 'You will lose access to this workspace immediately.'
            : `Remove ${pendingRemove?.email ?? 'this member'} from the workspace?`
        }
        confirmText={pendingRemove?.user_id === currentUser?.id ? 'Leave' : 'Remove'}
      />
    </div>
  );
}
