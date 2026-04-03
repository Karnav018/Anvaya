import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export function AppShell() {
  return (
    <div className="flex h-screen bg-[#0b0e14] text-[#ecedf6] overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto block-scrollbar">
        <Outlet />
      </main>
    </div>
  );
}
