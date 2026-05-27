import { useEffect, useState } from 'react';
import { Navbar } from '../components/layout/Navbar';
import { ProjectCard } from '../components/dashboard/ProjectCard';
import { CreateProjectModal } from '../components/dashboard/CreateProjectModal';
import { SkeletonCard } from '../components/ui/Skeleton';
import { api } from '../lib/api';
import { useOrgStore } from '../store/orgStore';
import type { Project } from '../lib/types';
import { Plus, Rocket } from 'lucide-react';

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const orgSlug = useOrgStore((s) => s.activeOrgSlug);

  const fetchProjects = async () => {
    if (!orgSlug) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get(`/o/${orgSlug}/projects`);
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
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold mb-2">Projects</h1>
            <p className="text-white/60">Manage your Anvaya API backends</p>
          </div>
          
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl transition-all shadow-[0_0_20px_-5px_rgba(99,102,241,0.4)] hover:shadow-[0_0_25px_-5px_rgba(99,102,241,0.6)]"
          >
            <Plus className="w-5 h-5" />
            New Project
          </button>
        </div>

        {loading ? (
          <div className="grid grid-flow-row grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-24 border-2 border-dashed border-border rounded-3xl bg-surface/30">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Rocket className="w-8 h-8 text-primary" />
              </div>
            </div>
            <h3 className="text-2xl font-semibold mb-3">No projects yet</h3>
            <p className="text-white/60 mb-8 max-w-md mx-auto">
              Create your first project to start visually building an API backend. 
              No code required!
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl transition-all shadow-[0_0_20px_-5px_rgba(99,102,241,0.4)]"
            >
              <Plus className="w-5 h-5" />
              Create your first project
            </button>
          </div>
        ) : (
          <div className="grid grid-flow-row grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard 
                key={project.id} 
                project={project} 
                onDelete={fetchProjects} 
              />
            ))}
          </div>
        )}
      </main>

      {orgSlug && (
        <CreateProjectModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={fetchProjects}
          orgSlug={orgSlug}
        />
      )}
    </div>
  );
}
