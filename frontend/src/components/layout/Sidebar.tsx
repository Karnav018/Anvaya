import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Code2, Users, Settings, CreditCard, UserCircle } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useOrgStore } from '../../store/orgStore';

export function Sidebar() {
  const location = useLocation();
  const path = location.pathname;
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const activeOrgSlug = useOrgStore((s) => s.activeOrgSlug);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const orgPrefix = activeOrgSlug ? `/o/${activeOrgSlug}` : '';

  const mainLinks = [
    { name: 'Dashboard', path: `${orgPrefix}/dashboard`, icon: Home },
  ];

  const settingsLinks = activeOrgSlug
    ? [
        { name: 'Team', path: `${orgPrefix}/settings/team`, icon: Users },
        { name: 'Workspace', path: `${orgPrefix}/settings/organization`, icon: Settings },
        { name: 'Billing', path: `${orgPrefix}/settings/billing`, icon: CreditCard },
        { name: 'Profile', path: `${orgPrefix}/settings/profile`, icon: UserCircle },
      ]
    : [];

  return (
    <aside className="w-[260px] h-screen shrink-0 bg-[#10131a] border-r border-[#1c2028] flex flex-col">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-[#a3a6ff] to-[#6063ee] p-2 rounded-lg">
            <Code2 className="w-5 h-5 text-[#0f00a4]" />
          </div>
          <span className="font-black text-lg tracking-wide text-[#ecedf6]">Anvaya</span>
        </div>
      </div>

      <div className="flex-1 px-4 space-y-8 overflow-y-auto block-scrollbar">
        <div>
          <h3 className="text-[10px] font-bold text-[#73757d] uppercase tracking-widest pl-2 mb-3">Admin</h3>
          <ul className="space-y-1">
            {mainLinks.map((link) => {
              const Icon = link.icon;
              const isActive = path === link.path || path === '/';
              return (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-[13px] font-medium ${
                      isActive ? 'bg-[#1c2028] text-[#a3a6ff]' : 'text-[#a9abb3] hover:text-[#ecedf6] hover:bg-[#161a21]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {link.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {settingsLinks.length > 0 && (
          <div>
            <h3 className="text-[10px] font-bold text-[#73757d] uppercase tracking-widest pl-2 mb-3">Settings</h3>
            <ul className="space-y-1">
              {settingsLinks.map((link) => {
                const Icon = link.icon;
                const isActive = path === link.path;
                return (
                  <li key={link.name}>
                    <Link
                      to={link.path}
                      className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-[13px] font-medium ${
                        isActive ? 'bg-[#1c2028] text-[#a3a6ff]' : 'text-[#a9abb3] hover:text-[#ecedf6] hover:bg-[#161a21]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {link.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-[#1c2028]">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[#161a21] transition-colors text-left"
        >
          <div className="w-8 h-8 rounded-full bg-[#1c2028] border border-[#45484f] flex items-center justify-center text-[#ecedf6] font-bold text-xs uppercase">
            {user?.name ? user.name.charAt(0) : 'U'}
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-[13px] font-medium text-[#ecedf6] truncate">{user?.name || 'User Admin'}</span>
            <span className="text-[11px] text-[#ff6e84] font-medium">Sign Out</span>
          </div>
        </button>
      </div>
    </aside>
  );
}
