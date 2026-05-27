import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AxiosError } from 'axios';
import { z } from 'zod';
import { api } from '../lib/api';
import { passwordSchema, validateData } from '../lib/validation';
import toast from 'react-hot-toast';

const resetPasswordSchema = z
  .object({
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

const INVALID_LINK_MESSAGE =
  'This reset link is invalid or has expired. Request a new one.';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const uid = searchParams.get('uid');
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [linkError, setLinkError] = useState<string | null>(null);

  const linkIsMissing = !uid || !token;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLinkError(null);

    const validation = validateData(resetPasswordSchema, {
      newPassword,
      confirmPassword,
    });
    if (!validation.success) {
      const errorMap: Record<string, string> = {};
      validation.errors?.forEach((error) => {
        errorMap[error.field] = error.message;
      });
      setErrors(errorMap);
      return;
    }

    if (linkIsMissing) {
      setLinkError(INVALID_LINK_MESSAGE);
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/password-reset/confirm', {
        uid,
        token,
        new_password: validation.data!.newPassword,
      });
      toast.success('Password reset. Please log in.');
      navigate('/login');
    } catch (err) {
      const axiosErr = err as AxiosError<{ detail?: string }>;
      const status = axiosErr.response?.status;
      const detail = axiosErr.response?.data?.detail;
      if (status === 400) {
        setLinkError(INVALID_LINK_MESSAGE);
      } else if (typeof detail === 'string') {
        setLinkError(detail);
      } else {
        setLinkError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md bg-surface border border-border p-8 rounded-2xl shadow-xl relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Reset Password</h1>
          <p className="text-white/60">Choose a new password for your account</p>
        </div>

        {linkIsMissing ? (
          <div className="space-y-4">
            <div className="bg-background border border-red-500/50 rounded-xl p-4 text-center">
              <p className="text-red-400 text-sm font-medium">
                Invalid or expired reset link
              </p>
              <p className="text-white/50 text-xs mt-2">
                Please request a new password reset email.
              </p>
            </div>
            <Link
              to="/login"
              className="block w-full text-center py-3 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl transition-colors"
            >
              Back to Log In
            </Link>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  className={`w-full px-4 py-2.5 rounded-xl bg-background border transition-all placeholder:text-white/20 outline-none ${
                    errors.newPassword
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-border focus:border-primary focus:ring-1 focus:ring-primary'
                  }`}
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                {errors.newPassword && (
                  <p className="text-red-400 text-xs mt-1">
                    {errors.newPassword}
                  </p>
                )}
                <p className="text-white/40 text-xs mt-1">
                  Must contain uppercase, lowercase, and number
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  className={`w-full px-4 py-2.5 rounded-xl bg-background border transition-all placeholder:text-white/20 outline-none ${
                    errors.confirmPassword
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-border focus:border-primary focus:ring-1 focus:ring-primary'
                  }`}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                {errors.confirmPassword && (
                  <p className="text-red-400 text-xs mt-1">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              {linkError && (
                <div className="bg-background border border-red-500/50 rounded-xl p-3">
                  <p className="text-red-400 text-xs">{linkError}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 mt-4 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>

            <p className="mt-6 text-center text-white/60">
              Remember your password?{' '}
              <Link
                to="/login"
                className="text-primary hover:text-primary/80 font-medium"
              >
                Log in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
