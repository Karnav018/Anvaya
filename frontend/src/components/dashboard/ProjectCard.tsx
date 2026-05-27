import { Calendar, ChevronRight, Trash2 } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import type { Project } from '../../lib/types';
import { api } from '../../lib/api';
import { useOrgStore } from '../../store/orgStore';
import { useCanEdit } from '../../hooks/useRole';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { ConfirmModal } from '../ui/ConfirmModal';

interface ProjectCardProps {
  project: Project;
  onDelete: () => void;
}

export function ProjectCard({ project, onDelete }: ProjectCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { orgSlug: paramSlug } = useParams<{ orgSlug: string }>();
  const fallbackSlug = useOrgStore((s) => s.activeOrgSlug);
  const orgSlug = paramSlug ?? fallbackSlug ?? '';
  const canEdit = useCanEdit();

  const handleDelete = async () => {
    try {
      await toast.promise(api.delete(`/o/${orgSlug}/projects/${project.id}`), {
        loading: 'Deleting project...',
        success: 'Project deleted',
        error: 'Failed to delete project',
      });
      onDelete();
    } catch {
      // Toast handles error UI
    }
  };

  const handleTrashClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  return (
    <>
      <Link
        to={`/o/${orgSlug}/editor/${project.id}`}
        className="group bg-surface border border-border hover:border-primary/50 p-6 rounded-2xl transition-all duration-300 hover:shadow-[0_0_30px_-10px_rgba(99,102,241,0.3)] flex flex-col justify-between block relative"
      >
        <div>
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-semibold text-lg text-white/90 group-hover:text-primary transition-colors">
              {project.name}
            </h3>
            {canEdit && (
              <button
                onClick={handleTrashClick}
                className="text-white/20 hover:text-red-400 hover:bg-red-400/10 p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
          <p className="text-sm text-white/60 line-clamp-2">
            {project.description || 'No description provided.'}
          </p>
        </div>

        <div className="mt-6 flex items-center justify-between text-xs text-white/40">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            {new Date(project.created_at).toLocaleDateString()}
          </div>
          <div className="flex items-center gap-1 text-primary opacity-0 group-hover:opacity-100 transition-all font-medium translation-x-[-10px] group-hover:translate-x-0">
            Open Editor <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </Link>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Project?"
        message={`Are you sure you want to permanently delete "${project.name}"? This action cannot be undone.`}
        confirmText="Delete"
      />
    </>
  );
}
