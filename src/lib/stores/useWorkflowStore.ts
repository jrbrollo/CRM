/**
 * Workflow Builder Store (Zustand)
 *
 * Manages the state of the workflow builder including nodes, edges,
 * selected node, and provides actions for workflow manipulation.
 */

import { create } from 'zustand';
import {
  Node,
  Edge,
  addEdge,
  Connection,
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
} from 'reactflow';
import type { WorkflowStepType, StepConfig } from '@/lib/types/workflow.types';
import { getNodeTypeForStep } from '@/components/workflows/CustomNodes';

interface WorkflowStore {
  // State
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;

  // Actions
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  setSelectedNodeId: (id: string | null) => void;

  addNode: (stepType: WorkflowStepType, label: string, position?: { x: number; y: number }) => void;
  updateNodeConfig: (nodeId: string, config: StepConfig) => void;
  deleteNode: (nodeId: string) => void;
  clearWorkflow: () => void;

  // Getters
  getSelectedNode: () => Node | null;
}

export const useWorkflowStore = create<WorkflowStore>((set, get) => ({
  // Initial State
  nodes: [],
  edges: [],
  selectedNodeId: null,

  // Setters
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  // React Flow Change Handlers
  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },

  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },

  onConnect: (connection) => {
    set({
      edges: addEdge(
        {
          ...connection,
          type: 'smoothstep',
          animated: true,
          style: { stroke: 'hsl(var(--primary))', strokeWidth: 2 },
        },
        get().edges
      ),
    });
  },

  setSelectedNodeId: (id) => set({ selectedNodeId: id }),

  // Add a new node to the canvas
  addNode: (stepType, label, position) => {
    const { nodes, edges } = get();

    // Generate unique ID
    const newNodeId = `node-${Date.now()}`;

    // Determine node type based on step type
    const nodeType = getNodeTypeForStep(stepType);

    // Calculate position
    let finalPosition = position;
    if (!finalPosition) {
      // Auto-position: place below the last node
      if (nodes.length > 0) {
        const lastNode = nodes[nodes.length - 1];
        finalPosition = {
          x: lastNode.position.x,
          y: lastNode.position.y + 150,
        };
      } else {
        // First node - center it
        finalPosition = { x: 250, y: 100 };
      }
    }

    // Create new node
    const newNode: Node = {
      id: newNodeId,
      type: nodeType,
      position: finalPosition,
      data: {
        label,
        stepType,
        config: {},
      },
    };

    // Auto-connect to the previous node if it exists
    let newEdges = edges;
    if (nodes.length > 0 && nodeType !== 'condition') {
      const lastNode = nodes[nodes.length - 1];

      // Only auto-connect if the last node is not a condition
      // (conditions need manual connection to specify true/false path)
      if (lastNode.type !== 'condition') {
        const newEdge: Edge = {
          id: `edge-${lastNode.id}-${newNodeId}`,
          source: lastNode.id,
          target: newNodeId,
          sourceHandle: 'output',
          targetHandle: 'input',
          type: 'smoothstep',
          animated: true,
          style: { stroke: 'hsl(var(--primary))', strokeWidth: 2 },
        };
        newEdges = [...edges, newEdge];
      }
    }

    set({
      nodes: [...nodes, newNode],
      edges: newEdges,
      selectedNodeId: newNodeId,
    });
  },

  // Update node configuration
  updateNodeConfig: (nodeId, config) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, config } }
          : node
      ),
    });
  },

  // Delete a node and its connected edges
  deleteNode: (nodeId) => {
    const { nodes, edges, selectedNodeId } = get();

    set({
      nodes: nodes.filter((node) => node.id !== nodeId),
      edges: edges.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId
      ),
      selectedNodeId: selectedNodeId === nodeId ? null : selectedNodeId,
    });
  },

  // Clear all nodes and edges
  clearWorkflow: () => {
    set({
      nodes: [],
      edges: [],
      selectedNodeId: null,
    });
  },

  // Get the currently selected node
  getSelectedNode: () => {
    const { nodes, selectedNodeId } = get();
    if (!selectedNodeId) return null;
    return nodes.find((node) => node.id === selectedNodeId) || null;
  },
}));
