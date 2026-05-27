import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { validateData, loginSchema } from '../lib/validation';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setAuth = useAuthStore((state) => state.setAuth);
  const next = searchParams.get('next');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    // Prepare data
    const loginData = { email: email.trim(), password };
    
    // Validate inputs
    const validation = validateData(loginSchema, loginData);
    if (!validation.success) {
      const errorMap: Record<string, string> = {};
      validation.errors?.forEach(error => {
        errorMap[error.field] = error.message;
      });
      setErrors(errorMap);
      return;
    }
    
    setLoading(true);
    
    try {
      const { data } = await toast.promise(
        api.post('/auth/login', validation.data),
        {
          loading: 'Logging in...',
          success: 'Welcome back! 🎉',
          error: (err) => err.response?.data?.detail || 'Invalid email or password',
        }
      );
      
      setAuth(data.user, data.access, data.refresh);
      navigate(next || '/dashboard');
    } catch (err) {
      // Toast handles error message
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
          <h1 className="text-3xl font-bold mb-2">Welcome to Anvaya</h1>
          <p className="text-white/60">Log in to manage your APIs</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">Email</label>
            <input
              type="email"
              required
              className={`w-full px-4 py-2.5 rounded-xl bg-background border transition-all placeholder:text-white/20 outline-none ${
                errors.email ? 'border-red-500 focus:ring-red-500' : 'border-border focus:border-primary focus:ring-1 focus:ring-primary'
              }`}
              placeholder="you@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {errors.email && (
              <p className="text-red-400 text-xs mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">Password</label>
            <input
              type="password"
              required
              className={`w-full px-4 py-2.5 rounded-xl bg-background border transition-all placeholder:text-white/20 outline-none ${
                errors.password ? 'border-red-500 focus:ring-red-500' : 'border-border focus:border-primary focus:ring-1 focus:ring-primary'
              }`}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {errors.password && (
              <p className="text-red-400 text-xs mt-1">{errors.password}</p>
            )}
            <div className="mt-2 text-right">
              <Link
                to="/forgot-password"
                className="text-primary hover:text-primary/80 font-medium text-sm"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-4 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-6 text-center text-white/60">
          Don't have an account?{' '}
          <Link to="/signup" className="text-primary hover:text-primary/80 font-medium">
            Sign up
          </Link>
        </p>

        <p className="mt-4 text-center">
          <Link
            to="/pricing"
            className="text-xs text-white/40 hover:text-white/70 transition-colors"
          >
            View plans →
          </Link>
        </p>
      </div>
    </div>
  );
}
