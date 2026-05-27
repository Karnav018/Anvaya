import { NavLink, Outlet, Link } from 'react-router-dom';
import { ArrowLeft, BookOpen } from 'lucide-react';

const NAV: Array<{ to: string; label: string }> = [
  { to: '/docs', label: 'Quickstart' },
  { to: '/docs/nodes', label: 'Node reference' },
  { to: '/docs/generated-code', label: 'Generated code' },
  { to: '/docs/teams', label: 'Teams & roles' },
  { to: '/docs/billing', label: 'Billing & plans' },
  { to: '/docs/research', label: 'Research' },
  { to: '/docs/changelog', label: 'Changelog' },
  { to: '/docs/faq', label: 'FAQ' },
];

export default function DocsLayout() {
  return (
    <div className="min-h-screen bg-background text-on-surface font-sans">
      {/* Top bar */}
      <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-[1200px] mx-auto px-6 md:px-10 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-white/70 hover:text-white transition-colors text-[14px]">
            <ArrowLeft size={16} /> Back to Anvaya
          </Link>
          <div className="flex items-center gap-2 text-white">
            <BookOpen size={16} className="text-primary" />
            <span className="font-semibold text-[15px]">Docs</span>
          </div>
        </div>
      </header>

      <div className="max-w-[1200px] mx-auto px-6 md:px-10 grid grid-cols-1 md:grid-cols-[220px_1fr] gap-10 py-10">
        {/* Sidebar */}
        <aside className="md:sticky md:top-20 self-start">
          <nav className="space-y-1">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/docs'}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-xl text-[14px] transition-colors ${
                    isActive
                      ? 'bg-primary/10 text-primary border border-primary/30'
                      : 'text-white/60 hover:text-white hover:bg-surface border border-transparent'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <article className="docs-prose min-w-0">
          <Outlet />
        </article>
      </div>
    </div>
  );
}
