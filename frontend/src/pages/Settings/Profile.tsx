import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { ConfirmModal } from '../../components/ui/ConfirmModal';

export default function Profile() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const refreshUser = useAuthStore((s) => s.refreshUser);
  const logout = useAuthStore((s) => s.logout);

  // Profile section
  const [name, setName] = useState(user?.name ?? '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password section
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);

  // Delete account section
  const [deleteEmailConfirm, setDeleteEmailConfirm] = useState('');
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Keep local form state in sync if user changes (e.g. after refresh).
  useEffect(() => {
    if (user?.name) setName(user.name);
  }, [user?.name]);

  if (!user) {
    return (
      <div className="p-10 max-w-3xl mx-auto">
        <div className="text-white/50 text-sm">Loading...</div>
      </div>
    );
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || trimmed === user.name) {
      toast('No changes to save', { icon: 'ℹ️' });
      return;
    }
    setSavingProfile(true);
    try {
      await api.patch('/auth/me', { name: trimmed });
      await refreshUser();
      toast.success('Profile updated.');
    } catch {
      // toast handled by interceptor
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Fill out all password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }
    if (newPassword === currentPassword) {
      setPasswordError('New password must be different from current password.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      return;
    }

    setChangingPassword(true);
    try {
      await api.post('/auth/me/password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      toast.success('Password changed.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      if (detail === 'current_password_incorrect') {
        setPasswordError('Current password is incorrect.');
      } else {
        // generic — toast interceptor already showed the error
      }
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccountStart = () => {
    if (deleteEmailConfirm.trim().toLowerCase() !== user.email.toLowerCase()) {
      toast.error('Type your email to confirm.');
      return;
    }
    setConfirmDeleteOpen(true);
  };

  const handleDeleteAccountConfirm = async () => {
    setDeleting(true);
    try {
      await api.delete('/auth/me');
      toast.success('Account deactivated.');
      logout();
      navigate('/', { replace: true });
    } catch {
      // toast handled by interceptor
    } finally {
      setDeleting(false);
    }
  };

  const emailMatches = deleteEmailConfirm.trim().toLowerCase() === user.email.toLowerCase();

  return (
    <div className="p-10 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white tracking-tight mb-2">Profile</h1>
        <p className="text-sm text-white/60">Manage your personal account settings.</p>
      </div>

      {/* Profile section */}
      <form
        onSubmit={handleSaveProfile}
        className="bg-surface border border-border rounded-2xl p-6 space-y-5"
      >
        <h2 className="text-lg font-semibold text-white">Profile</h2>
        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">Email</label>
          <input
            type="email"
            value={user.email}
            readOnly
            disabled
            className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-white/60 cursor-not-allowed disabled:opacity-70"
          />
          <p className="text-xs text-white/40 mt-1">Email cannot be changed.</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">Name</label>
          <input
            type="text"
            required
            minLength={1}
            maxLength={80}
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={savingProfile}
            className="w-full px-4 py-2.5 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-white disabled:opacity-50"
          />
        </div>
        <div className="flex justify-end">
          <Button type="submit" variant="primary" loading={savingProfile}>
            Save changes
          </Button>
        </div>
      </form>

      {/* Change password section */}
      <form
        onSubmit={handleChangePassword}
        className="mt-8 bg-surface border border-border rounded-2xl p-6 space-y-5"
      >
        <h2 className="text-lg font-semibold text-white">Change password</h2>
        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">Current password</label>
          <input
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            disabled={changingPassword}
            className="w-full px-4 py-2.5 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-white disabled:opacity-50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">New password</label>
          <input
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={changingPassword}
            className="w-full px-4 py-2.5 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-white disabled:opacity-50"
          />
          <p className="text-xs text-white/40 mt-1">At least 8 characters.</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">
            Confirm new password
          </label>
          <input
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={changingPassword}
            className="w-full px-4 py-2.5 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-white disabled:opacity-50"
          />
        </div>
        {passwordError && (
          <p className="text-red-400 text-xs flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3" />
            {passwordError}
          </p>
        )}
        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            loading={changingPassword}
            disabled={!currentPassword || !newPassword || !confirmPassword}
          >
            Change password
          </Button>
        </div>
      </form>

      {/* Danger zone */}
      <section className="mt-8 bg-surface border border-red-500/40 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-red-400 mb-2">Delete account</h2>
        <p className="text-sm text-white/60 mb-4">
          This is permanent — your account will be deactivated and you will no longer be able to
          log in.
        </p>
        <label className="block text-xs text-white/60 mb-2">
          Type your email <span className="font-mono text-white/80">{user.email}</span> to confirm:
        </label>
        <input
          type="email"
          value={deleteEmailConfirm}
          onChange={(e) => setDeleteEmailConfirm(e.target.value)}
          disabled={deleting}
          placeholder={user.email}
          className="w-full px-4 py-2.5 rounded-xl bg-background border border-border focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all text-white text-sm mb-3 disabled:opacity-50"
        />
        <Button
          type="button"
          variant="danger"
          onClick={handleDeleteAccountStart}
          loading={deleting}
          disabled={!emailMatches}
        >
          Delete account
        </Button>
      </section>

      <ConfirmModal
        isOpen={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={handleDeleteAccountConfirm}
        title="Delete account?"
        message="This is permanent — your account will be deactivated."
        confirmText="Delete my account"
        cancelText="Cancel"
        isDestructive
      />
    </div>
  );
}
