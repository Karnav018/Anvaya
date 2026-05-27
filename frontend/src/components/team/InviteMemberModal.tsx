import { useState } from 'react';
import toast from 'react-hot-toast';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { api } from '../../lib/api';
import type { OrgRole } from '../../store/orgStore';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  orgSlug: string;
  onSuccess?: () => void;
}

export function InviteMemberModal({ isOpen, onClose, orgSlug, onSuccess }: InviteMemberModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Exclude<OrgRole, 'owner'>>('editor');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post(`/orgs/${orgSlug}/invitations`, {
        email: email.trim().toLowerCase(),
        role,
      });
      toast.success('Invite sent.');
      setEmail('');
      setRole('editor');
      onSuccess?.();
      onClose();
    } catch {
      // toast handled by api interceptor
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={loading ? () => {} : onClose} title="Invite member">
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">Email address</label>
          <input
            type="email"
            required
            autoFocus
            disabled={loading}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="teammate@company.com"
            className="w-full px-4 py-2.5 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all disabled:opacity-50 text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">Role</label>
          <select
            value={role}
            disabled={loading}
            onChange={(e) => setRole(e.target.value as Exclude<OrgRole, 'owner'>)}
            className="w-full px-4 py-2.5 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-white disabled:opacity-50"
          >
            <option value="editor">Editor — can create and edit projects</option>
            <option value="viewer">Viewer — read-only access</option>
          </select>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            Send invite
          </Button>
        </div>
      </form>
    </Modal>
  );
}
