import { useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { ReactFlowProvider } from 'reactflow';
import { Navbar } from '../components/layout/Navbar';
import { BlockPalette } from '../components/panels/BlockPalette';
import { ConfigPanel } from '../components/panels/ConfigPanel';
import { AnvayaCanvas } from '../components/canvas/AnvayaCanvas';
import { CanvasToolbar } from '../components/canvas/CanvasToolbar';
import { useCanvasStore } from '../store/canvasStore';
import { api } from '../lib/api';
import toast from 'react-hot-toast';

export default function Editor() {
  const { projectId } = useParams();
  const { setProjectId, loadBlueprint, getBlueprintPayload } = useCanvasStore();

  useEffect(() => {
    if (projectId) {
      setProjectId(projectId);
      loadSavedBlueprint(projectId);
    }
  }, [projectId]);

  const loadSavedBlueprint = async (pId: string) => {
    try {
      const { data } = await api.get(`/blueprints/${pId}`);
      loadBlueprint(data.canvas_json);
    } catch {
      toast.error('Failed to load blueprint');
    }
  };

  const saveBlueprint = useCallback(async () => {
    if (!projectId) return;
    try {
      const payload = getBlueprintPayload();
      await api.post(`/blueprints/${projectId}`, payload);
      toast.success('Blueprint saved');
    } catch {
      toast.error('Failed to save blueprint');
    }
  }, [projectId, getBlueprintPayload]);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden relative">
      <Navbar />
      
      <div className="flex-1 flex overflow-hidden">
        <BlockPalette />
        
        <main className="flex-1 relative bg-[#0a0a0f]">
          <ReactFlowProvider>
            <CanvasToolbar onSave={saveBlueprint} />
            <AnvayaCanvas />
          </ReactFlowProvider>
        </main>
        
        <ConfigPanel />
      </div>
    </div>
  );
}
