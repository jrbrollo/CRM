/**
 * Workflow Converter
 *
 * CRITICAL: Converts React Flow structure (nodes[] + edges[]) to Backend format (graph object).
 * This is the most important piece of logic for the Workflow Builder.
 */

import { Node, Edge } from 'reactflow';
import type { StepConfig } from '@/lib/types/workflow.types';

/**
 * Backend Node Structure
 * This is what the Firebase backend expects
 */
export interface BackendNode {
  id: string;
  type: string;
  nextId?: string; // For linear nodes (action, delay, trigger)
  trueNextId?: string; // For condition nodes (true path)
  falseNextId?: string; // For condition nodes (false path)
  config: StepConfig; // Configuration data from the property editor
}

/**
 * Validation Error Types
 */
export interface ValidationError {
  type: 'orphan' | 'condition_incomplete' | 'no_trigger' | 'multiple_triggers' | 'disconnected';
  message: string;
  nodeId?: string;
}

/**
 * Validation Result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Validates the workflow before conversion
 *
 * Checks:
 * 1. Must have at least one node
 * 2. Must have exactly one trigger node
 * 3. No orphan nodes (nodes without connections)
 * 4. Condition nodes must have both true and false paths
 * 5. All nodes must be reachable from the trigger
 */
export function validateWorkflow(nodes: Node[], edges: Edge[]): ValidationResult {
  const errors: ValidationError[] = [];

  // Check 1: Must have nodes
  if (nodes.length === 0) {
    errors.push({
      type: 'no_trigger',
      message: 'O workflow deve ter pelo menos um nó',
    });
    return { isValid: false, errors };
  }

  // Check 2: Trigger validation
  const triggerNodes = nodes.filter(node => node.type === 'trigger');
  if (triggerNodes.length === 0) {
    errors.push({
      type: 'no_trigger',
      message: 'O workflow deve começar com um nó Gatilho',
    });
  }
  if (triggerNodes.length > 1) {
    errors.push({
      type: 'multiple_triggers',
      message: 'O workflow só pode ter um nó Gatilho',
    });
  }

  // Check 3: Orphan nodes (except trigger which can have no input)
  for (const node of nodes) {
    const hasIncomingEdge = edges.some(edge => edge.target === node.id);
    const hasOutgoingEdge = edges.some(edge => edge.source === node.id);

    // Trigger nodes only need outgoing edges
    if (node.type === 'trigger') {
      if (!hasOutgoingEdge) {
        errors.push({
          type: 'orphan',
          message: `O nó Gatilho "${node.data.label}" não está conectado a nenhum próximo passo`,
          nodeId: node.id,
        });
      }
    } else {
      // All other nodes need at least incoming edges
      // (outgoing is optional only for terminal nodes)
      if (!hasIncomingEdge) {
        errors.push({
          type: 'orphan',
          message: `O nó "${node.data.label}" está órfão (sem conexão de entrada)`,
          nodeId: node.id,
        });
      }
    }
  }

  // Check 4: Condition nodes must have both true and false paths
  const conditionNodes = nodes.filter(node => node.type === 'condition');
  for (const conditionNode of conditionNodes) {
    const outgoingEdges = edges.filter(edge => edge.source === conditionNode.id);

    const hasTruePath = outgoingEdges.some(edge => edge.sourceHandle === 'true');
    const hasFalsePath = outgoingEdges.some(edge => edge.sourceHandle === 'false');

    if (!hasTruePath || !hasFalsePath) {
      errors.push({
        type: 'condition_incomplete',
        message: `O nó de Condição "${conditionNode.data.label}" precisa ter ambos os caminhos (Sim e Não) conectados`,
        nodeId: conditionNode.id,
      });
    }
  }

  // Check 5: All nodes must be reachable from trigger
  if (triggerNodes.length === 1) {
    const reachableNodes = getReachableNodes(triggerNodes[0].id, nodes, edges);
    for (const node of nodes) {
      if (!reachableNodes.has(node.id) && node.id !== triggerNodes[0].id) {
        errors.push({
          type: 'disconnected',
          message: `O nó "${node.data.label}" não está conectado ao fluxo principal`,
          nodeId: node.id,
        });
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Helper: Get all nodes reachable from a starting node (BFS)
 */
function getReachableNodes(startNodeId: string, nodes: Node[], edges: Edge[]): Set<string> {
  const reachable = new Set<string>([startNodeId]);
  const queue = [startNodeId];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const outgoingEdges = edges.filter(edge => edge.source === currentId);

    for (const edge of outgoingEdges) {
      if (!reachable.has(edge.target)) {
        reachable.add(edge.target);
        queue.push(edge.target);
      }
    }
  }

  return reachable;
}

/**
 * CRITICAL FUNCTION: Convert React Flow structure to Backend format
 *
 * Converts:
 * - nodes: Node[] + edges: Edge[]
 * To:
 * - nodes: Record<string, BackendNode>
 *
 * The backend expects a graph where each node knows its next node(s):
 * - Regular nodes: have nextId
 * - Condition nodes: have trueNextId and falseNextId
 */
export function convertFlowToBackend(
  nodes: Node[],
  edges: Edge[]
): Record<string, BackendNode> {
  const backendNodes: Record<string, BackendNode> = {};

  nodes.forEach((node) => {
    // 1. Find all outgoing connections from this node
    const outgoingEdges = edges.filter((edge) => edge.source === node.id);

    // 2. Prepare the base node object
    const nodePayload: BackendNode = {
      id: node.id,
      type: node.data.stepType, // Use the stepType, not the visual node type
      config: node.data.config || {}, // Configuration from property editor
    };

    // 3. Map connections based on node type
    if (node.type === 'condition') {
      // For condition nodes, we need to identify which edge is true and which is false
      const trueEdge = outgoingEdges.find((edge) => edge.sourceHandle === 'true');
      const falseEdge = outgoingEdges.find((edge) => edge.sourceHandle === 'false');

      if (trueEdge) {
        nodePayload.trueNextId = trueEdge.target;
      }
      if (falseEdge) {
        nodePayload.falseNextId = falseEdge.target;
      }
    } else {
      // For linear nodes (action, delay, trigger)
      // They have only one output, so take the first outgoing edge
      if (outgoingEdges.length > 0) {
        nodePayload.nextId = outgoingEdges[0].target;
      }
    }

    backendNodes[node.id] = nodePayload;
  });

  return backendNodes;
}

/**
 * Find the trigger node ID (entry point of the workflow)
 */
export function findTriggerNodeId(nodes: Node[]): string | null {
  const triggerNode = nodes.find(node => node.type === 'trigger');
  return triggerNode?.id || null;
}

/**
 * Convert Backend format back to React Flow format (for loading existing workflows)
 */
export function convertBackendToFlow(
  backendNodes: Record<string, BackendNode>
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Helper to determine visual node type from step type
  const getVisualNodeType = (stepType: string) => {
    if (stepType === 'wait') return 'delay';
    if (stepType === 'conditional') return 'condition';
    return 'action';
  };

  // Helper to get label for step type
  const getLabelForStepType = (stepType: string): string => {
    const labels: Record<string, string> = {
      assign_round_robin: 'Atribuir Deal (Round-Robin)',
      create_deal: 'Criar Novo Deal',
      update_deal: 'Atualizar Deal',
      move_deal_stage: 'Mover para Etapa',
      create_task: 'Criar Tarefa',
      complete_task: 'Completar Tarefa',
      send_notification: 'Enviar Notificação',
      send_email: 'Enviar Email',
      send_whatsapp: 'Enviar WhatsApp',
      increment_counter: 'Incrementar Contador',
      track_sla_violation: 'Registrar Violação de SLA',
      log_activity: 'Registrar Atividade',
      wait: 'Aguardar (Delay)',
      conditional: 'Ramificação (If/Else)',
      webhook: 'Webhook',
    };
    return labels[stepType] || stepType;
  };

  // Convert nodes
  let yPosition = 100;
  Object.entries(backendNodes).forEach(([id, backendNode], index) => {
    nodes.push({
      id,
      type: getVisualNodeType(backendNode.type),
      position: { x: 250, y: yPosition },
      data: {
        label: getLabelForStepType(backendNode.type),
        stepType: backendNode.type,
        config: backendNode.config,
      },
    });
    yPosition += 150;
  });

  // Convert edges
  Object.entries(backendNodes).forEach(([id, backendNode]) => {
    if (backendNode.nextId) {
      // Linear connection
      edges.push({
        id: `edge-${id}-${backendNode.nextId}`,
        source: id,
        target: backendNode.nextId,
        sourceHandle: 'output',
        targetHandle: 'input',
        type: 'smoothstep',
        animated: true,
        style: { stroke: 'hsl(var(--primary))', strokeWidth: 2 },
      });
    }

    if (backendNode.trueNextId) {
      // True path
      edges.push({
        id: `edge-${id}-true-${backendNode.trueNextId}`,
        source: id,
        target: backendNode.trueNextId,
        sourceHandle: 'true',
        targetHandle: 'input',
        type: 'smoothstep',
        animated: true,
        style: { stroke: 'hsl(142.1 76.2% 36.3%)', strokeWidth: 2 }, // Green
      });
    }

    if (backendNode.falseNextId) {
      // False path
      edges.push({
        id: `edge-${id}-false-${backendNode.falseNextId}`,
        source: id,
        target: backendNode.falseNextId,
        sourceHandle: 'false',
        targetHandle: 'input',
        type: 'smoothstep',
        animated: true,
        style: { stroke: 'hsl(0 84.2% 60.2%)', strokeWidth: 2 }, // Red
      });
    }
  });

  return { nodes, edges };
}
