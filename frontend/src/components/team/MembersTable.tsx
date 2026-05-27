import { Trash2 } from 'lucide-react';
import type { OrgRole } from '../../store/orgStore';

export interface Member {
  user_id: string;
  email: string;
  name: string;
  role: OrgRole;
  joined_at: string;
}

interface MembersTableProps {
  members: Member[];
  currentUserId: string | null;
  canManage: boolean;
  onRoleChange: (member: Member, role: OrgRole) => void | Promise<void>;
  onRemove: (member: Member) => void | Promise<void>;
}

function Avatar({ name }: { name: string }) {
  const initial = (name || '?').charAt(0).toUpperCase();
  return (
    <div className="w-8 h-8 rounded-full bg-[#1c2028] border border-[#45484f] flex items-center justify-center text-[#ecedf6] font-bold text-xs uppercase shrink-0">
      {initial}
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

export function MembersTable({
  members,
  currentUserId,
  canManage,
  onRoleChange,
  onRemove,
}: MembersTableProps) {
  if (members.length === 0) {
    return (
      <div className="text-center py-12 text-white/50 text-sm">
        No members yet.
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/50 text-left text-[11px] uppercase tracking-wider text-white/40">
            <th className="px-4 py-3 font-semibold">Member</th>
            <th className="px-4 py-3 font-semibold">Role</th>
            <th className="px-4 py-3 font-semibold">Joined</th>
            <th className="px-4 py-3 font-semibold w-px"></th>
          </tr>
        </thead>
        <tbody>
          {members.map((m) => {
            const isSelf = m.user_id === currentUserId;
            const editable = canManage && !isSelf;
            return (
              <tr
                key={m.user_id}
                className="border-b border-border/30 hover:bg-white/[0.02] transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={m.name || m.email} />
                    <div className="flex flex-col min-w-0">
                      <span className="text-white/90 font-medium truncate">
                        {m.name || m.email}
                        {isSelf && (
                          <span className="ml-2 text-[10px] text-white/40 font-normal">(you)</span>
                        )}
                      </span>
                      <span className="text-white/40 text-xs truncate">{m.email}</span>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {canManage ? (
                    <select
                      value={m.role}
                      disabled={!editable}
                      onChange={(e) => onRoleChange(m, e.target.value as OrgRole)}
                      className="px-2 py-1 rounded-md bg-background border border-border text-white/90 text-xs outline-none focus:border-primary disabled:opacity-60"
                    >
                      <option value="owner">Owner</option>
                      <option value="editor">Editor</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  ) : (
                    <span className="text-white/70 text-xs capitalize">{m.role}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-white/50 text-xs">{formatDate(m.joined_at)}</td>
                <td className="px-4 py-3 text-right">
                  {(canManage || isSelf) && (
                    <button
                      type="button"
                      onClick={() => onRemove(m)}
                      className="p-1.5 text-white/30 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors"
                      title={isSelf ? 'Leave organization' : 'Remove member'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
