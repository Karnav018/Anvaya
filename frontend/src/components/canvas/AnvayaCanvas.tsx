import { useCallback } from 'react';
import { Wand2 } from 'lucide-react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
} from 'reactflow';
import type { Node, Connection } from 'reactflow';
import 'reactflow/dist/style.css';
import { useCanvasStore } from '../../store/canvasStore';
import { RouteBlock, AuthBlock, DatabaseBlock, MiddlewareBlock, ResponseBlock, FetchBlock, CacheBlock, EmailBlock, UploadBlock, AIBlock, PaymentBlock, CronBlock } from '../blocks/CustomNodes';

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
  cron: CronBlock,
};

export function AnvayaCanvas() {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    setSelectedNode,
    pushHistory,
    layoutNodes,
  } = useCanvasStore();

  const handleConnect = useCallback(
    (connection: Connection) => {
      pushHistory();
      onConnect(connection);
    },
    [onConnect, pushHistory]
  );

  const isValidConnection = useCallback(
    (connection: Connection) => {
      const sourceNode = nodes.find((n) => n.id === connection.source);
      const targetNode = nodes.find((n) => n.id === connection.target);

      if (!sourceNode || !targetNode) return false;

      // 1. Routes are roots (cannot be targets)
      if (targetNode.type === 'route') return false;

      // 2. Responses are leaves (cannot be sources)
      if (sourceNode.type === 'response') return false;

      // 3. Acyclic Check: target node's downstream cannot include sourceNode
      const hasCycle = (currTargetId: string, visited: Set<string> = new Set()): boolean => {
        if (currTargetId === sourceNode.id) return true;
        if (visited.has(currTargetId)) return true;
        
        visited.add(currTargetId);
        for (const edge of edges) {
          if (edge.source === currTargetId) {
            if (hasCycle(edge.target, visited)) return true;
          }
        }
        return false;
      };

      if (hasCycle(targetNode.id)) return false;

      return true;
    },
    [nodes, edges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const defaultEdgeOptions = {
    animated: true,
    style: { stroke: '#8b5cf6', strokeWidth: 2, filter: 'drop-shadow(0 0 5px rgba(139, 92, 246, 0.4))' },
  };

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;

      // In a real app we'd map container bounds to reactFlowInstance.project(position)
      // For simplicity, we just drop it approximately
      const position = {
        x: event.clientX - 350, // offset for palette and nav
        y: event.clientY - 100, 
      };

      const newNode: Node = {
        id: `node-${Date.now()}`,
        type,
        position,
        data: getDefaultDataForType(type),
      };

      addNode(newNode);
    },
    [addNode]
  );

  const onSelectionChange = useCallback(
    ({ nodes }: { nodes: Node[] }) => {
      if (nodes.length === 1) {
        setSelectedNode(nodes[0].id);
      } else {
        setSelectedNode(null);
      }
    },
    [setSelectedNode]
  );

  return (
    <div className="w-full h-full relative" onDrop={onDrop} onDragOver={onDragOver}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        isValidConnection={isValidConnection}
        onNodeDragStop={() => pushHistory()}
        onSelectionChange={onSelectionChange}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <div className="absolute top-4 left-4 z-50 flex gap-2">
          <button
            onClick={() => layoutNodes('TB')}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-900/80 backdrop-blur-md border border-white/10 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all shadow-xl group"
            title="Auto-layout Nodes"
          >
            <Wand2 className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium">Magic Layout</span>
          </button>
        </div>
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#3f3f46" />

        <Controls className="bg-zinc-900 border border-white/10 rounded-xl overflow-hidden [&>button]:border-b-white/10 [&>button]:text-zinc-400 hover:[&>button]:bg-zinc-800" />
        <MiniMap 
          nodeColor={(n) => {
            switch(n.type) {
              case 'route': return '#6366f1';
              case 'auth': return '#eab308';
              case 'database': return '#3b82f6';
              case 'middleware': return '#a855f7';
              case 'response': return '#f97316';
              default: return '#eee';
            }
          }}
          maskColor="rgba(10,10,15,0.7)"
          className="bg-surface border border-border rounded-xl"
        />
      </ReactFlow>
    </div>
  );
}

function getDefaultDataForType(type: string) {
  switch (type) {
    case 'route': return { method: 'GET', path: '/api/resource', description: 'New Route' };
    case 'auth': return { strategy: 'jwt', secret_env_var: 'JWT_SECRET' };
    case 'database': return { provider: 'postgres', model: 'User', action: 'findAll' };
    case 'fetch': return { method: 'GET', url: 'https://api.example.com/data' };
    case 'cache': return { ttl: 3600, cache_key: 'req.url' };
    case 'email': return { to: 'req.body.email', subject: 'Welcome' };
    case 'upload': return { bucket: 'my-s3-bucket' };
    case 'ai': return { prompt: 'Summarize the input: ${req.body.text}' };
    case 'payment': return { mode: 'payment', product_id: 'prod_12345' };
    case 'middleware': return { name: 'CORS' };
    case 'response': return { status_code: 200, body: 'data' };
    case 'cron': return { schedule: '0 0 * * *', description: 'Daily Sync' };
    default: return {};
  }
}
