import { Save, RefreshCw, Trash2, Home, DownloadCloud, Undo2, Redo2, Wand2, Check, Clock } from 'lucide-react';
import { useReactFlow } from 'reactflow';
import { useCanvasStore } from '../../store/canvasStore';
import { useAuthStore } from '../../store/authStore';
import { useOrgStore } from '../../store/orgStore';
import { useUIStore } from '../../store/uiStore';
import { useCanEdit } from '../../hooks/useRole';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { getLayoutedElements } from '../../lib/dagreLayout';
import { ConfirmModal } from '../ui/ConfirmModal';
import { HelpModal } from '../ui/HelpModal';

interface CanvasToolbarProps {
  onSave: () => Promise<void>;
  saveStatus?: 'saved' | 'saving' | 'unsaved';
}

export function CanvasToolbar({ onSave, saveStatus = 'saved' }: CanvasToolbarProps) {
  const { fitView } = useReactFlow();
  const { loadBlueprint, past, future, undo, redo, nodes, edges, setElements } = useCanvasStore();
  const { projectId, orgSlug: paramSlug } = useParams<{ projectId: string; orgSlug: string }>();
  const fallbackSlug = useOrgStore((s) => s.activeOrgSlug);
  const orgSlug = paramSlug ?? fallbackSlug ?? '';
  const canEdit = useCanEdit();
  const navigate = useNavigate();
  const openUpgrade = useUIStore((s) => s.openUpgrade);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const onLayout = () => {
    if (!canEdit) return;
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges);
    setElements(layoutedNodes, layoutedEdges);
    setTimeout(() => fitView({ duration: 800 }), 50);
    toast.success('✨ Graph auto-layouted');
  };

  const handleClear = () => {
    if (!canEdit) return;
    loadBlueprint(null);
    toast.success('Canvas cleared');
  };

  const handleGenerate = async () => {
    if (!projectId || !orgSlug) return;
    if (!canEdit) {
      toast.error('You have view-only access to this workspace.');
      return;
    }
    if (nodes.length === 0) {
      toast.error('Add at least one block to the canvas before generating.');
      return;
    }
    setIsGenerating(true);

    // First, save the latest state automatically
    await onSave();

    try {
      toast.loading('Generating Express backend...', { id: 'codegen' });

      const { data } = await api.post<{
        language: string;
        project_slug: string;
        files: Record<string, string>;
      }>(`/o/${orgSlug}/generate/${projectId}?format=json`, {});

      // Update the user's credits limit if they successfully generated
      useAuthStore.getState().refreshUser();

      toast.success('Code generated!', { id: 'codegen' });
      navigate(`/o/${orgSlug}/editor/${projectId}/preview`, {
        state: {
          files: data.files,
          projectSlug: data.project_slug,
        },
      });
    } catch (err: unknown) {
      toast.dismiss('codegen');
      const e = err as {
        response?: {
          status?: number;
          data?: {
            detail?:
              | string
              | { code?: string; message?: string; errors?: string[] };
          };
        };
      };
      const status = e?.response?.status;
      const detail = e?.response?.data?.detail;

      if (status === 429) {
        const code =
          detail && typeof detail === 'object' ? detail.code : undefined;
        if (code === 'quota_exceeded') {
          const msg =
            (detail && typeof detail === 'object' && detail.message) ||
            'Monthly generation quota exceeded.';
          openUpgrade(msg);
        } else {
          toast.error('Monthly generation quota exceeded!');
        }
      } else if (status === 400) {
        const errors =
          detail && typeof detail === 'object' ? detail.errors : undefined;
        if (Array.isArray(errors) && errors.length > 0) {
          toast.error(errors[0]);
        } else {
          const msg =
            typeof detail === 'string'
              ? detail
              : (detail && typeof detail === 'object' && detail.message) ||
                'Validation failed.';
          toast.error(msg);
        }
      } else {
        toast.error('Failed to generate backend code.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Save status indicator component
  const SaveStatusIndicator = () => {
    if (saveStatus === 'saving') {
      return (
        <span className="flex items-center gap-1.5 text-[10px] text-yellow-400/70">
          <Clock className="w-3 h-3 animate-pulse" />
          Saving...
        </span>
      );
    }
    if (saveStatus === 'saved') {
      return (
        <span className="flex items-center gap-1.5 text-[10px] text-green-400/70">
          <Check className="w-3 h-3" />
          Saved
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1.5 text-[10px] text-white/40">
        <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
        Unsaved changes
      </span>
    );
  };

  const dashboardHref = orgSlug ? `/o/${orgSlug}/dashboard` : '/dashboard';

  return (
    <>
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-20">
        <div className="flex items-center gap-1 bg-[#22262f] border border-[#45484f]/40 p-1 rounded-md shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          <Link
            to={dashboardHref}
            className="p-1.5 text-[#a9abb3] hover:text-[#ecedf6] hover:bg-[#282c36] rounded transition-colors"
            title="Back to Dashboard"
          >
            <Home className="w-4 h-4" />
          </Link>

          <div className="w-px h-4 bg-[#45484f] mx-1" />

          <button
            onClick={undo}
            disabled={past.length === 0 || !canEdit}
            className="p-1.5 text-[#a9abb3] hover:text-[#ecedf6] hover:bg-[#282c36] disabled:opacity-30 disabled:cursor-not-allowed rounded transition-colors"
            title="Undo (⌘Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>

          <button
            onClick={redo}
            disabled={future.length === 0 || !canEdit}
            className="p-1.5 text-[#a9abb3] hover:text-[#ecedf6] hover:bg-[#282c36] disabled:opacity-30 disabled:cursor-not-allowed rounded transition-colors"
            title="Redo (⇧⌘Z)"
          >
            <Redo2 className="w-4 h-4" />
          </button>

          <div className="w-px h-4 bg-[#45484f] mx-1" />

          <button
            onClick={onLayout}
            disabled={!canEdit}
            className="p-1.5 text-[#a3a6ff]/80 hover:text-[#a3a6ff] hover:bg-[#a3a6ff]/10 disabled:opacity-30 disabled:cursor-not-allowed rounded transition-colors"
            title="Auto Layout Graph"
          >
            <Wand2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => fitView({ duration: 800 })}
            className="p-1.5 text-[#a9abb3] hover:text-[#ecedf6] hover:bg-[#282c36] rounded transition-colors"
            title="Fit View"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {canEdit && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="p-1.5 text-[#a9abb3] hover:text-[#ff6e84] hover:bg-[#ff6e84]/10 rounded transition-colors"
              title="Clear Canvas"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <div className="w-px h-4 bg-[#45484f] mx-1" />

          {canEdit && (
            <button
              onClick={onSave}
              disabled={saveStatus === 'saving'}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1c2028] text-[#ecedf6] hover:bg-[#282c36] border border-[#45484f]/40 rounded transition-colors font-medium text-[11px] disabled:opacity-50"
              title="Save (⌘S)"
            >
              <Save className="w-3.5 h-3.5" />
              Save
            </button>
          )}

          {canEdit && (
            <button
              onClick={handleGenerate}
              disabled={isGenerating || saveStatus === 'saving' || nodes.length === 0}
              title={nodes.length === 0 ? 'Add at least one block first' : 'Generate code'}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-br from-[#A3A6FF] to-[#6063EE] text-[#0f00a4] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-opacity font-semibold text-[11px] shadow-[0_4px_10px_rgba(96,99,238,0.3)]"
            >
              <DownloadCloud className="w-3.5 h-3.5" />
              {isGenerating ? 'Building...' : 'Generate'}
            </button>
          )}

          {!canEdit && (
            <span className="px-3 py-1.5 text-[11px] text-white/60 font-medium">View-only</span>
          )}
        </div>

        {/* Save status indicator below toolbar */}
        <SaveStatusIndicator />
      </div>

      <ConfirmModal
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={handleClear}
        title="Clear Canvas?"
        message="This will remove all blocks and connections from the canvas. This action cannot be undone."
        confirmText="Clear"
      />

      <HelpModal
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
      />
    </>
  );
}
