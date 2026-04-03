import { Save, RefreshCw, Trash2, Home, DownloadCloud, Undo2, Redo2, Wand2, Check, Clock } from 'lucide-react';
import { useReactFlow } from 'reactflow';
import { useCanvasStore } from '../../store/canvasStore';
import { useAuthStore } from '../../store/authStore';
import { Link, useParams } from 'react-router-dom';
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
  const { projectId } = useParams();
  const [isGenerating, setIsGenerating] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const onLayout = () => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges);
    setElements(layoutedNodes, layoutedEdges);
    setTimeout(() => fitView({ duration: 800 }), 50);
    toast.success('✨ Graph auto-layouted');
  };

  const handleClear = () => {
    loadBlueprint(null);
    toast.success('Canvas cleared');
  };

  const handleGenerate = async () => {
    if (!projectId) return;
    setIsGenerating(true);

    // First, save the latest state automatically
    await onSave();

    try {
      toast.loading('Generating Express backend...', { id: 'codegen' });

      const response = await api.post(`/generate/${projectId}`, {}, {
        responseType: 'blob' // Essential for receiving correct raw bytes for the ZIP
      });

      // Update the user's credits limit if they successfully generated
      useAuthStore.getState().refreshUser();

      // Trigger browser download mechanism
      const blob = new Blob([response.data], { type: 'application/zip' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `anvaya_backend_${projectId.substring(0, 8)}.zip`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);

      toast.success('🎉 Backend downloaded successfully!', { id: 'codegen' });
    } catch (err: any) {
      if (err.response?.status === 429) {
        toast.error('Monthly generation quota exceeded!', { id: 'codegen' });
      } else {
        toast.error('Failed to generate backend code.', { id: 'codegen' });
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

  return (
    <>
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-20">
        <div className="flex items-center gap-1 bg-[#22262f] border border-[#45484f]/40 p-1 rounded-md shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          <Link
            to="/dashboard"
            className="p-1.5 text-[#a9abb3] hover:text-[#ecedf6] hover:bg-[#282c36] rounded transition-colors"
            title="Back to Dashboard"
          >
            <Home className="w-4 h-4" />
          </Link>

          <div className="w-px h-4 bg-[#45484f] mx-1" />

          <button
            onClick={undo}
            disabled={past.length === 0}
            className="p-1.5 text-[#a9abb3] hover:text-[#ecedf6] hover:bg-[#282c36] disabled:opacity-30 disabled:cursor-not-allowed rounded transition-colors"
            title="Undo (⌘Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>

          <button
            onClick={redo}
            disabled={future.length === 0}
            className="p-1.5 text-[#a9abb3] hover:text-[#ecedf6] hover:bg-[#282c36] disabled:opacity-30 disabled:cursor-not-allowed rounded transition-colors"
            title="Redo (⇧⌘Z)"
          >
            <Redo2 className="w-4 h-4" />
          </button>

          <div className="w-px h-4 bg-[#45484f] mx-1" />

          <button
            onClick={onLayout}
            className="p-1.5 text-[#a3a6ff]/80 hover:text-[#a3a6ff] hover:bg-[#a3a6ff]/10 rounded transition-colors"
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

          <button
            onClick={() => setShowClearConfirm(true)}
            className="p-1.5 text-[#a9abb3] hover:text-[#ff6e84] hover:bg-[#ff6e84]/10 rounded transition-colors"
            title="Clear Canvas"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <div className="w-px h-4 bg-[#45484f] mx-1" />

          <button
            onClick={onSave}
            disabled={saveStatus === 'saving'}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1c2028] text-[#ecedf6] hover:bg-[#282c36] border border-[#45484f]/40 rounded transition-colors font-medium text-[11px] disabled:opacity-50"
            title="Save (⌘S)"
          >
            <Save className="w-3.5 h-3.5" />
            Save
          </button>

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-br from-[#A3A6FF] to-[#6063EE] text-[#0f00a4] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-opacity font-semibold text-[11px] shadow-[0_4px_10px_rgba(96,99,238,0.3)]"
          >
            <DownloadCloud className="w-3.5 h-3.5" />
            {isGenerating ? 'Building...' : 'Export'}
          </button>
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
