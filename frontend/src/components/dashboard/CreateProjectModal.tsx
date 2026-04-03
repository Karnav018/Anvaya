import { useState } from 'react';
import { X } from 'lucide-react';
import { api } from '../../lib/api';
import { Button } from '../ui/Button';
import toast from 'react-hot-toast';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateProjectModal({ isOpen, onClose, onSuccess }: CreateProjectModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await toast.promise(api.post('/projects', { name, description }), {
        loading: 'Creating project...',
        success: '🎉 Project created successfully!',
        error: 'Failed to create project',
      });
      onSuccess();
      onClose();
      setName('');
      setDescription('');
    } catch {
      // Handled by toast
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !loading) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div 
        className="w-full max-w-lg bg-surface border border-border rounded-2xl shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b border-border/50">
          <h2 className="text-xl font-semibold">New Project</h2>
          <button 
            onClick={onClose} 
            disabled={loading}
            className="text-white/40 hover:text-white transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Project Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              disabled={loading}
              minLength={3}
              maxLength={50}
              className="w-full px-4 py-2.5 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all disabled:opacity-50"
              placeholder="e.g. Acme Ecommerce API"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <p className="text-xs text-white/40 mt-1">3-50 characters</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Description (Optional)
            </label>
            <textarea
              disabled={loading}
              maxLength={200}
              className="w-full px-4 py-2.5 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none h-24 disabled:opacity-50"
              placeholder="What does this backend do?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <p className="text-xs text-white/40 mt-1">{description.length}/200</p>
          </div>

          <div className="flex justify-end gap-3 mt-8">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={loading}
            >
              Create Project
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
