import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { LogOut, Code2 } from 'lucide-react';

export function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="h-16 border-b border-border bg-surface/50 backdrop-blur-md sticky top-0 z-50 px-6 flex flex-row items-center justify-between">
      <Link to="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
        <div className="bg-primary/20 p-1.5 rounded-lg">
          <Code2 className="w-5 h-5 text-primary" />
        </div>
        <span className="font-bold text-lg tracking-wide">Anvaya</span>
      </Link>

      <div className="flex items-center gap-6 text-sm">
        <div className="flex flex-col items-end">
          <span className="font-medium text-white/90">{user?.name}</span>
          <span className="text-white/50 text-xs">
            {user?.generations_limit && user.generations_limit - user.generations_used} credits left
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          title="Log out"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </nav>
  );
}
