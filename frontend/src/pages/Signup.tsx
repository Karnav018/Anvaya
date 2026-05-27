import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { validateData, signupSchema } from '../lib/validation';
import toast from 'react-hot-toast';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    // Prepare data
    const signupData = { 
      name: name.trim(), 
      email: email.trim(), 
      password 
    };
    
    // Validate inputs
    const validation = validateData(signupSchema, signupData);
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
      // 1. Create account
      await toast.promise(
        api.post('/auth/signup', validation.data),
        {
          loading: 'Creating account...',
          success: 'Account created! 🎉',
          error: (err) => err.response?.data?.detail || 'Signup failed',
        }
      );
      
      // 2. Auto-login right after signup
      if (validation.data) {
        const { data } = await api.post('/auth/login', { 
          email: validation.data.email, 
          password: validation.data.password 
        });
        setAuth(data.user, data.access, data.refresh);

        navigate('/dashboard');
      }
    } catch (err) {
      // Errors handled by toast
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
          <h1 className="text-3xl font-bold mb-2">Create Account</h1>
          <p className="text-white/60">Start building APIs visually</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">Name</label>
            <input
              type="text"
              required
              className={`w-full px-4 py-2.5 rounded-xl bg-background border transition-all placeholder:text-white/20 outline-none ${
                errors.name ? 'border-red-500 focus:ring-red-500' : 'border-border focus:border-primary focus:ring-1 focus:ring-primary'
              }`}
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {errors.name && (
              <p className="text-red-400 text-xs mt-1">{errors.name}</p>
            )}
          </div>

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
            <p className="text-white/40 text-xs mt-1">
              Must contain uppercase, lowercase, and number
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-4 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Sign Up'}
          </button>
        </form>

        <p className="mt-6 text-center text-white/60">
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:text-primary/80 font-medium">
            Log in
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
