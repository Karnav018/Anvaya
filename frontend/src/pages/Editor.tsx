import { useEffect, useCallback, useState, Suspense, lazy } from 'react';
import { useParams } from 'react-router-dom';
import { ReactFlowProvider } from 'reactflow';
import { Navbar } from '../components/layout/Navbar';
import { useCanvasStore } from '../store/canvasStore';
import { useCommonShortcuts } from '../hooks/useKeyboardShortcuts';
import { useDebounce } from '../hooks/useDebounce';
import { useCanEdit } from '../hooks/useRole';
import { api } from '../lib/api';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

// Lazy load heavy editor components
const BlockPalette = lazy(() => import('../components/panels/BlockPalette').then(module => ({ default: module.BlockPalette })));
const ConfigPanel = lazy(() => import('../components/panels/ConfigPanel').then(module => ({ default: module.ConfigPanel })));
const AnvayaCanvas = lazy(() => import('../components/canvas/AnvayaCanvas').then(module => ({ default: module.AnvayaCanvas })));
const CanvasToolbar = lazy(() => import('../components/canvas/CanvasToolbar').then(module => ({ default: module.CanvasToolbar })));

export default function Editor() {
  const { projectId, orgSlug } = useParams<{ projectId: string; orgSlug: string }>();
  const canEdit = useCanEdit();
  const {
    setProjectId,
    loadBlueprint,
    getBlueprintPayload,
    undo,
    redo,
    selectedNode,
    deleteNode,
    nodes,
    edges,
  } = useCanvasStore();

  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    if (projectId && orgSlug) {
      setProjectId(projectId);
      loadSavedBlueprint(projectId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, orgSlug]);

  const loadSavedBlueprint = async (pId: string) => {
    if (!orgSlug) return;
    try {
      const { data } = await api.get(`/o/${orgSlug}/blueprints/${pId}`);
      loadBlueprint(data.canvas_json);
      setSaveStatus('saved');
      setLastSaved(new Date());
    } catch {
      toast.error('Failed to load blueprint');
    }
  };

  const saveBlueprint = useCallback(async (showToast = true) => {
    if (!projectId || !orgSlug) return;
    if (!canEdit) {
      if (showToast) toast.error('You have view-only access to this workspace.');
      return;
    }
    try {
      setSaveStatus('saving');
      const payload = getBlueprintPayload();

      if (showToast) {
        await toast.promise(
          api.post(`/o/${orgSlug}/blueprints/${projectId}`, payload),
          {
            loading: 'Saving...',
            success: '✅ Blueprint saved',
            error: 'Failed to save blueprint',
          }
        );
      } else {
        await api.post(`/o/${orgSlug}/blueprints/${projectId}`, payload);
      }

      setSaveStatus('saved');
      setLastSaved(new Date());
    } catch {
      setSaveStatus('unsaved');
      if (showToast) {
        toast.error('Failed to save blueprint');
      }
    }
  }, [projectId, orgSlug, canEdit, getBlueprintPayload]);

  // Auto-save (debounced, without toast) — disabled for viewers
  const autoSave = useDebounce(() => {
    if (projectId && saveStatus !== 'saving' && canEdit) {
      saveBlueprint(false);
    }
  }, 30000); // 30 seconds

  // Trigger auto-save when nodes or edges change
  useEffect(() => {
    if (projectId && lastSaved && canEdit) {
      setSaveStatus('unsaved');
      autoSave();
    }
  }, [nodes, edges]);

  const handleDelete = useCallback(() => {
    if (!canEdit) return;
    if (selectedNode) {
      deleteNode(selectedNode.id);
      toast.success('Node deleted');
    }
  }, [selectedNode, deleteNode, canEdit]);

  // Keyboard shortcuts (no-ops if viewer)
  useCommonShortcuts({
    onSave: () => saveBlueprint(true),
    onUndo: canEdit ? undo : () => {},
    onRedo: canEdit ? redo : () => {},
    onDelete: handleDelete,
  });

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden relative">
      <Navbar saveStatus={saveStatus} lastSaved={lastSaved} />

      <div className="flex-1 flex overflow-hidden">
        <Suspense fallback={<div className="w-64 bg-[#10131a] border-r border-[#1c2028] flex items-center justify-center"><LoadingSpinner size="sm" /></div>}>
          <BlockPalette />
        </Suspense>

        <main className="flex-1 relative bg-[#0a0a0f]">
          <ReactFlowProvider>
            <Suspense fallback={<div className="absolute top-4 left-4 z-50"><LoadingSpinner size="sm" /></div>}>
              <CanvasToolbar onSave={() => saveBlueprint(true)} saveStatus={saveStatus} />
            </Suspense>
            <Suspense fallback={<LoadingSpinner />}>
              <AnvayaCanvas />
            </Suspense>
          </ReactFlowProvider>
        </main>

        <Suspense fallback={<div className="w-80 bg-[#10131a] border-l border-[#1c2028] flex items-center justify-center"><LoadingSpinner size="sm" /></div>}>
          <ConfigPanel />
        </Suspense>
      </div>
    </div>
  );
}
