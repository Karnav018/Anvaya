import { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  Panel,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow';
import type { Node, Edge, Connection } from 'reactflow';
import 'reactflow/dist/style.css';
import { useCanvasStore } from '../../store/canvasStore';
import { 
  RouteBlock, AuthBlock, DatabaseBlock, MiddlewareBlock, ResponseBlock, 
  FetchBlock, CacheBlock, EmailBlock, UploadBlock, AIBlock, PaymentBlock, 
  SchemaBlock, ValidationBlock, ErrorHandlerBlock, ResponseSchemaBlock 
} from '../blocks/CustomNodes';
import { CanvasEmptyState } from './CanvasEmptyState';
import { EnhancedCanvasToolbar } from './EnhancedCanvasToolbar';
import { CustomCanvasControls } from './CustomCanvasControls';
import { CustomMiniMap } from './CustomMiniMap';
import { 
  Copy, Trash2, Play, RotateCcw, RotateCw, ZoomIn, ZoomOut, 
  Maximize, Grid, Eye, EyeOff, Layers
} from 'lucide-react';
import { cn } from '../../lib/utils';

const nodeTypes = {
  route: RouteBlock,
  auth: AuthBlock,
  database: DatabaseBlock,
  middleware: MiddlewareBlock,
  response: ResponseBlock,
  fetch: FetchBlock,
  cache: CacheBlock,
  email: EmailBlock,
  upload: UploadBlock,
  ai: AIBlock,
  payment: PaymentBlock,
  schema: SchemaBlock,
  validation: ValidationBlock,
  error_handler: ErrorHandlerBlock,
  response_schema: ResponseSchemaBlock,
};

function EnhancedCanvasInner() {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    setSelectedNode,
    pushHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    selectedNodes,
    setSelectedNodes,
  } = useCanvasStore();

  const { fitView, zoomIn, zoomOut, setCenter } = useReactFlow();
  const [showMiniMap, setShowMiniMap] = useState(true);
  const [showBackground, setShowBackground] = useState(true);
  const [isValidConnection, setIsValidConnection] = useState(true);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Prevent shortcuts when typing in inputs
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      const { ctrlKey, metaKey, key, shiftKey } = event;
      const isMod = ctrlKey || metaKey;

      switch (key) {
        case 'z':
          if (isMod && !shiftKey) {
            event.preventDefault();
            undo();
          } else if (isMod && shiftKey) {
            event.preventDefault();
            redo();
          }
          break;
        case 'y':
          if (isMod) {
            event.preventDefault();
            redo();
          }
          break;
        case 'c':
          if (isMod && selectedNodes.length > 0) {
            event.preventDefault();
            copySelectedNodes();
          }
          break;
        case 'v':
          if (isMod) {
            event.preventDefault();
            pasteNodes();
          }
          break;
        case 'Delete':
        case 'Backspace':
          if (selectedNodes.length > 0) {
            event.preventDefault();
            deleteSelectedNodes();
          }
          break;
        case 'a':
          if (isMod) {
            event.preventDefault();
            selectAllNodes();
          }
          break;
        case 'Escape':
          event.preventDefault();
          setSelectedNodes([]);
          setSelectedNode(null);
          break;
        case '0':
          if (isMod) {
            event.preventDefault();
            fitView();
          }
          break;
        case '=':
        case '+':
          if (isMod) {
            event.preventDefault();
            zoomIn();
          }
          break;
        case '-':
          if (isMod) {
            event.preventDefault();
            zoomOut();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodes, undo, redo, zoomIn, zoomOut, fitView, setSelectedNode, setSelectedNodes]);

  const handleConnect = useCallback(
    (connection: Connection) => {
      // Validate connection logic
      const sourceNode = nodes.find(n => n.id === connection.source);
      const targetNode = nodes.find(n => n.id === connection.target);
      
      if (!isValidNodeConnection(sourceNode, targetNode)) {
        setIsValidConnection(false);
        setTimeout(() => setIsValidConnection(true), 2000);
        return;
      }

      pushHistory();
      onConnect(connection);
    },
    [onConnect, pushHistory, nodes]
  );

  // Connection validation
  const isValidNodeConnection = (source: Node | undefined, target: Node | undefined) => {
    if (!source || !target) return false;
    
    // Prevent self-connections
    if (source.id === target.id) return false;
    
    // Basic validation rules
    const invalidConnections = [
      // Response nodes should generally be at the end
      { from: 'response', to: ['route', 'auth', 'database', 'validation'] },
      // Route nodes should generally be at the beginning
      { to: 'route', from: ['database', 'response', 'middleware'] },
    ];

    return !invalidConnections.some(rule => {
      if (Array.isArray(rule.to)) {
        return rule.from === source.type && rule.to.includes(target.type);
      }
      if (Array.isArray(rule.from)) {
        return rule.to === target.type && rule.from.includes(source.type);
      }
      return rule.from === source.type && rule.to === target.type;
    });
  };

  // Multi-selection handlers
  const handleSelectionChange = useCallback(({ nodes: selectedNodes }: { nodes: Node[] }) => {
    setSelectedNodes(selectedNodes);
    if (selectedNodes.length === 1) {
      setSelectedNode(selectedNodes[0].id);
    } else {
      setSelectedNode(null);
    }
  }, [setSelectedNodes, setSelectedNode]);

  // Copy/paste functionality
  const [clipboard, setClipboard] = useState<Node[]>([]);

  const copySelectedNodes = () => {
    if (selectedNodes.length === 0) return;
    setClipboard([...selectedNodes]);
  };

  const pasteNodes = () => {
    if (clipboard.length === 0) return;
    
    pushHistory();
    
    clipboard.forEach((node, index) => {
      const newNode = {
        ...node,
        id: `${node.id}_copy_${Date.now()}_${index}`,
        position: {
          x: node.position.x + 50,
          y: node.position.y + 50
        }
      };
      addNode(newNode.type, newNode.position, newNode.data);
    });
  };

  const deleteSelectedNodes = () => {
    if (selectedNodes.length === 0) return;
    
    pushHistory();
    // This would need to be implemented in the store
    // deleteNodes(selectedNodes.map(n => n.id));
  };

  const selectAllNodes = () => {
    setSelectedNodes(nodes);
  };

  // Auto-layout functionality
  const autoLayout = () => {
    pushHistory();
    // Simple auto-layout: arrange nodes in a grid
    const gridSize = Math.ceil(Math.sqrt(nodes.length));
    const spacing = 250;
    
    nodes.forEach((node, index) => {
      const row = Math.floor(index / gridSize);
      const col = index % gridSize;
      
      // This would need to be implemented in the store
      // updateNodePosition(node.id, {
      //   x: col * spacing + 100,
      //   y: row * spacing + 100
      // });
    });
  };

  // Drag and drop from palette
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      
      const reactFlowBounds = event.currentTarget.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');
      
      if (!type) return;
      
      const position = {
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      };
      
      pushHistory();
      addNode(type, position);
    },
    [addNode, pushHistory]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  return (
    <div className="relative w-full h-full">
      {/* Enhanced Canvas Toolbar */}
      <EnhancedCanvasToolbar />
      
      {/* Main ReactFlow Canvas */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        onSelectionChange={handleSelectionChange}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        fitView
        multiSelectionKeyCode={['Meta', 'Shift']}
        deleteKeyCode={['Backspace', 'Delete']}
        selectionOnDrag={true}
        panOnDrag={[1, 2]} // Left and middle mouse button
        className={cn(
          "bg-[#0f1218] transition-all duration-300",
          !isValidConnection && "ring-2 ring-red-500/50"
        )}
        attributionPosition="bottom-left"
      >
        {/* Background with toggle */}
        {showBackground && (
          <Background 
            variant={BackgroundVariant.Dots} 
            gap={20} 
            size={1} 
            color="#1a1f2e" 
          />
        )}

        {/* Custom Enhanced Controls */}
        <CustomCanvasControls 
          position="bottom-right"
          showInteractionButton={true}
          showZoom={true}
          showFitView={true}
        />

        {/* Custom MiniMap with toggle */}
        {showMiniMap && (
          <CustomMiniMap 
            position="top-right"
            showNodes={true}
          />
        )}

        {/* Canvas Control Panels */}
        <Panel position="top-right" className="mr-4 mt-16">
          <div className="flex flex-col gap-2">
            {/* View Controls */}
            <div className="bg-[#10131a] border border-[#1c2028] rounded-lg p-2 shadow-lg">
              <div className="flex gap-1">
                <button
                  onClick={() => setShowMiniMap(!showMiniMap)}
                  className={cn(
                    "p-1.5 rounded text-[10px] transition-colors",
                    showMiniMap 
                      ? "bg-[#a3a6ff]/20 text-[#a3a6ff]" 
                      : "text-[#a9abb3] hover:text-[#ecedf6] hover:bg-[#161a21]"
                  )}
                  title="Toggle MiniMap"
                >
                  <Layers className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setShowBackground(!showBackground)}
                  className={cn(
                    "p-1.5 rounded text-[10px] transition-colors",
                    showBackground 
                      ? "bg-[#a3a6ff]/20 text-[#a3a6ff]" 
                      : "text-[#a9abb3] hover:text-[#ecedf6] hover:bg-[#161a21]"
                  )}
                  title="Toggle Grid"
                >
                  <Grid className="w-3 h-3" />
                </button>
                <button
                  onClick={fitView}
                  className="p-1.5 rounded text-[10px] text-[#a9abb3] hover:text-[#ecedf6] hover:bg-[#161a21] transition-colors"
                  title="Fit View (Ctrl+0)"
                >
                  <Maximize className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Action Controls */}
            {selectedNodes.length > 0 && (
              <div className="bg-[#10131a] border border-[#1c2028] rounded-lg p-2 shadow-lg">
                <div className="flex flex-col gap-1">
                  <div className="text-[10px] text-[#a9abb3] px-1 mb-1">
                    {selectedNodes.length} selected
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={copySelectedNodes}
                      className="p-1.5 rounded text-[10px] text-[#a9abb3] hover:text-[#ecedf6] hover:bg-[#161a21] transition-colors"
                      title="Copy (Ctrl+C)"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    <button
                      onClick={deleteSelectedNodes}
                      className="p-1.5 rounded text-[10px] text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                      title="Delete (Del)"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Panel>

        {/* History Controls */}
        <Panel position="bottom-left" className="ml-4 mb-4">
          <div className="bg-[#10131a] border border-[#1c2028] rounded-lg p-2 shadow-lg">
            <div className="flex gap-1">
              <button
                onClick={undo}
                disabled={!canUndo}
                className={cn(
                  "p-1.5 rounded text-[10px] transition-colors",
                  canUndo 
                    ? "text-[#a9abb3] hover:text-[#ecedf6] hover:bg-[#161a21]"
                    : "text-[#5a5c63] cursor-not-allowed"
                )}
                title="Undo (Ctrl+Z)"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
              <button
                onClick={redo}
                disabled={!canRedo}
                className={cn(
                  "p-1.5 rounded text-[10px] transition-colors",
                  canRedo 
                    ? "text-[#a9abb3] hover:text-[#ecedf6] hover:bg-[#161a21]"
                    : "text-[#5a5c63] cursor-not-allowed"
                )}
                title="Redo (Ctrl+Y)"
              >
                <RotateCw className="w-3 h-3" />
              </button>
            </div>
          </div>
        </Panel>

        {/* Connection Validation Feedback */}
        {!isValidConnection && (
          <Panel position="top-center" className="mt-4">
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg px-3 py-2 shadow-lg">
              <p className="text-xs text-red-300">
                Invalid connection! Check the node flow logic.
              </p>
            </div>
          </Panel>
        )}

        {/* Empty State */}
        {nodes.length === 0 && <CanvasEmptyState />}
      </ReactFlow>

      {/* Keyboard Shortcuts Help */}
      <div className="absolute bottom-4 left-4 bg-[#10131a]/80 border border-[#1c2028] rounded-lg p-3 text-[10px] text-[#a9abb3] backdrop-blur-sm max-w-xs">
        <div className="font-semibold text-[#ecedf6] mb-2">Shortcuts</div>
        <div className="space-y-1">
          <div><kbd className="bg-[#161a21] px-1 rounded">Ctrl+Z</kbd> Undo</div>
          <div><kbd className="bg-[#161a21] px-1 rounded">Ctrl+Y</kbd> Redo</div>
          <div><kbd className="bg-[#161a21] px-1 rounded">Ctrl+C</kbd> Copy</div>
          <div><kbd className="bg-[#161a21] px-1 rounded">Del</kbd> Delete</div>
          <div><kbd className="bg-[#161a21] px-1 rounded">Ctrl+0</kbd> Fit View</div>
        </div>
      </div>
    </div>
  );
}

export function EnhancedAnvayaCanvas() {
  return (
    <ReactFlowProvider>
      <EnhancedCanvasInner />
    </ReactFlowProvider>
  );
}