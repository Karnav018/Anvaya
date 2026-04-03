import { create } from 'zustand';
import type {
  Node,
  Edge,
  Connection,
  NodeChange,
  EdgeChange,
} from 'reactflow';
import {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
} from 'reactflow';

export interface Snapshot {
  nodes: Node[];
  edges: Edge[];
}

export interface CanvasState {
  nodes: Node[];
  edges: Edge[];
  selectedNode: Node | null;
  projectId: string | null;
  lastSavedVersion: number;
  past: Snapshot[];
  future: Snapshot[];
  
  // History Actions
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;
  
  // Actions
  setProjectId: (id: string) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  addNode: (node: Node) => void;
  updateNodeData: (id: string, data: any) => void;
  setSelectedNode: (id: string | null) => void;
  deleteNode: (id: string) => void;
  
  // Backend sync
  loadBlueprint: (blueprint: any) => void;
  getBlueprintPayload: () => any;
  setElements: (nodes: Node[], edges: Edge[]) => void;
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNode: null,
  projectId: null,
  lastSavedVersion: 1,
  past: [],
  future: [],

  pushHistory: () => {
    const { nodes, edges, past } = get();
    // Keep max 50 history steps
    const newPast = [...past, { nodes, edges }].slice(-50);
    set({ past: newPast, future: [] });
  },

  undo: () => {
    const { past, future, nodes, edges } = get();
    if (past.length === 0) return;

    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);
    
    set({
      past: newPast,
      future: [{ nodes, edges }, ...future],
      nodes: previous.nodes,
      edges: previous.edges,
      selectedNode: null
    });
  },

  redo: () => {
    const { past, future, nodes, edges } = get();
    if (future.length === 0) return;

    const next = future[0];
    const newFuture = future.slice(1);

    set({
      past: [...past, { nodes, edges }],
      future: newFuture,
      nodes: next.nodes,
      edges: next.edges,
      selectedNode: null
    });
  },

  setProjectId: (id) => set({ projectId: id }),

  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
    // Check if selected node was deleted
    const selected = get().selectedNode;
    if (selected && !get().nodes.find(n => n.id === selected.id)) {
      set({ selectedNode: null });
    }
  },

  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },

  onConnect: (connection) => {
    set({
      edges: addEdge({ ...connection, animated: true }, get().edges),
    });
  },

  addNode: (node) => {
    get().pushHistory();
    set({ nodes: [...get().nodes, node] });
  },

  updateNodeData: (id, data) => {
    set({
      nodes: get().nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, ...data } } : n
      ),
    });
    // Refresh selected node if it's the one we're updating
    const selected = get().selectedNode;
    if (selected && selected.id === id) {
      set({ selectedNode: { ...selected, data: { ...selected.data, ...data } } });
    }
  },

  setSelectedNode: (id) => {
    if (!id) {
      set({ selectedNode: null });
      return;
    }
    const node = get().nodes.find((n) => n.id === id) || null;
    set({ selectedNode: node });
  },

  deleteNode: (id) => {
    get().pushHistory();
    set({
      nodes: get().nodes.filter((n) => n.id !== id),
      edges: get().edges.filter((e) => e.source !== id && e.target !== id),
      selectedNode: get().selectedNode?.id === id ? null : get().selectedNode
    });
  },

  loadBlueprint: (blueprint) => {
    // Expected to receive the canvas_json from backend
    if (!blueprint) {
      set({ nodes: [], edges: [], lastSavedVersion: 1, past: [], future: [] });
      return;
    }
    set({
      nodes: blueprint.nodes || [],
      edges: blueprint.edges || [],
      lastSavedVersion: blueprint.version || 1,
      past: [],
      future: []
    });
  },

  setElements: (nodes, edges) => {
    get().pushHistory();
    set({ nodes, edges });
  },

  getBlueprintPayload: () => {
    const { nodes, edges, lastSavedVersion } = get();
    return {
      canvas_json: {
        version: "1.0.0", // Semantic version
        nodes,
        edges,
      }
    };
  },
}));
