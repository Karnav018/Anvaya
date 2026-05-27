import { useState } from 'react';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { api } from '../lib/api';
import { validateData } from '../lib/validation';
import toast from 'react-hot-toast';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

const GENERIC_SUCCESS_MESSAGE =
  "If an account exists for that email, we've sent a reset link";

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const data = { email: email.trim() };

    const validation = validateData(forgotPasswordSchema, data);
    if (!validation.success) {
      const errorMap: Record<string, string> = {};
      validation.errors?.forEach((error) => {
        errorMap[error.field] = error.message;
      });
      setErrors(errorMap);
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/password-reset/request', validation.data);
    } catch (err) {
      // Intentionally swallow errors: we always show the same generic message
      // so we don't leak whether an account exists.
    } finally {
      toast.success(GENERIC_SUCCESS_MESSAGE);
      setSubmitted(true);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md bg-surface border border-border p-8 rounded-2xl shadow-xl relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Forgot Password</h1>
          <p className="text-white/60">
            Enter your email and we'll send you a reset link
          </p>
        </div>

        {submitted ? (
          <div className="space-y-4">
            <div className="bg-background border border-border rounded-xl p-4 text-center">
              <p className="text-white/80 text-sm">{GENERIC_SUCCESS_MESSAGE}.</p>
              <p className="text-white/50 text-xs mt-2">
                Check your inbox (and spam folder) for the reset link.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Email
              </label>
              <input
                type="email"
                required
                className={`w-full px-4 py-2.5 rounded-xl bg-background border transition-all placeholder:text-white/20 outline-none ${
                  errors.email
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-border focus:border-primary focus:ring-1 focus:ring-primary'
                }`}
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {errors.email && (
                <p className="text-red-400 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-4 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-white/60">
          Remember your password?{' '}
          <Link
            to="/login"
            className="text-primary hover:text-primary/80 font-medium"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
