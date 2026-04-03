import { useEffect, useState } from 'react';
import { Server, Plus } from 'lucide-react';
import { api } from '../lib/api';
import type { Project } from '../lib/types';
import { CreateProjectModal } from '../components/dashboard/CreateProjectModal';
import { useNavigate } from 'react-router-dom';

export default function ProjectDashboard() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    try {
      const { data } = await api.get('/projects');
      setProjects(data);
    } catch (err) {
      console.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return (
    <div className="p-10 max-w-6xl mx-auto">
      <div className="mb-10 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-[#ecedf6] tracking-tight mb-2">Projects</h1>
          <p className="text-sm font-medium text-[#a9abb3]">Manage your Anvaya API backends and orchestrations</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#1c2028] hover:bg-[#282c36] text-[#ecedf6] border border-[#45484f]/40 rounded-lg transition-colors font-medium text-[13px] shadow-[0_4px_10px_rgba(0,0,0,0.2)]"
        >
          <Plus className="w-4 h-4 text-[#a3a6ff]" />
          New Project
        </button>
      </div>

      <div className="max-w-3xl">
        <div className="space-y-4">
          {loading ? (
             <div className="text-center py-10 border border-dashed border-[#1c2028] rounded-xl bg-[#10131a]">
               <Server className="w-6 h-6 text-[#45484f] animate-pulse mx-auto mb-2" />
               <p className="text-[12px] text-[#73757d]">Loading projects...</p>
             </div>
          ) : projects.length === 0 ? (
             <div className="text-center py-10 border border-dashed border-[#1c2028] rounded-xl bg-[#10131a]">
               <h3 className="text-sm font-semibold text-[#ecedf6] mb-1">No Projects</h3>
               <p className="text-[12px] text-[#73757d] mb-4">Create your first project to orchestrate a backend API.</p>
               <button
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-[#1c2028] hover:bg-[#282c36] text-[#ecedf6] border border-[#45484f]/40 rounded mx-auto transition-colors font-medium text-[12px]"
               >
                 <Plus className="w-3.5 h-3.5 text-[#a3a6ff]" /> Get Started
               </button>
             </div>
          ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {projects.map(p => (
                 <WorkflowCard
                   key={p.id}
                   name={p.name}
                   id={p.id.substring(0, 8)}
                   status="live"
                   onClick={() => navigate(`/editor/${p.id}`)}
                 />
               ))}
             </div>
          )}
        </div>
      </div>

      <CreateProjectModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchProjects}
      />
    </div>
  );
}

function WorkflowCard({ name, id, status, onClick }: { name: string, id: string, status: 'live'|'warning', onClick: () => void }) {
  return (
    <div 
      onClick={onClick}
      className="bg-[#10131a] border border-[#1c2028] rounded-lg p-5 flex items-center justify-between group hover:bg-[#161a21] hover:border-[#a3a6ff]/30 transition-all cursor-pointer shadow-[0_4px_10px_rgba(0,0,0,0.2)]"
    >
      <div className="flex flex-col">
        <span className="font-semibold text-[15px] text-[#ecedf6] mb-1 group-hover:text-[#ffffff] transition-colors">{name}</span>
        <span className="font-mono text-[11px] text-[#a9abb3] bg-[#1c2028] px-2 py-0.5 rounded border border-[#22262f] max-w-fit">ID: {id}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-[10px] text-[#73757d] opacity-0 group-hover:opacity-100 transition-opacity">Open Editor</span>
        <div className={`w-2.5 h-2.5 rounded-full ${status === 'live' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]'}`} />
      </div>
    </div>
  );
}


