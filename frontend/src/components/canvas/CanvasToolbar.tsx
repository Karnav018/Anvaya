import { Save, RefreshCw, Trash2, Home, DownloadCloud, Undo2, Redo2, Wand2 } from 'lucide-react';
import { useReactFlow } from 'reactflow';
import { useCanvasStore } from '../../store/canvasStore';
import { useAuthStore } from '../../store/authStore';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { getLayoutedElements } from '../../lib/dagreLayout';

export function CanvasToolbar({ onSave }: { onSave: () => Promise<void> }) {
  const { fitView } = useReactFlow();
  const { loadBlueprint, past, future, undo, redo, nodes, edges, setElements } = useCanvasStore();
  const { projectId } = useParams();
  const [isGenerating, setIsGenerating] = useState(false);

  // Keyboard Shortcuts (Undo/Redo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  const onLayout = () => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges);
    setElements(layoutedNodes, layoutedEdges);
    setTimeout(() => fitView({ duration: 800 }), 50);
    toast.success('Graph Auto-Layouted', { id: 'layout' });
  };

  const handleClear = () => {
    if (confirm('Are you sure you want to clear the canvas?')) {
      loadBlueprint(null);
      toast.success('Canvas cleared');
    }
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

      toast.success('Backend downloaded successfully!', { id: 'codegen' });
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

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-[#22262f] border border-[#45484f]/40 p-1 rounded-md shadow-[0_8px_32px_rgba(0,0,0,0.5)] z-20">
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
        onClick={handleClear}
        className="p-1.5 text-[#a9abb3] hover:text-[#ff6e84] hover:bg-[#ff6e84]/10 rounded transition-colors"
        title="Clear Canvas"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      <div className="w-px h-4 bg-[#45484f] mx-1" />

      <button
        onClick={onSave}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1c2028] text-[#ecedf6] hover:bg-[#282c36] border border-[#45484f]/40 rounded transition-colors font-medium text-[11px]"
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
  );
}
