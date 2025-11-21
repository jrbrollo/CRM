/**
 * Workflow Engine - Core Types
 *
 * Arquitetura Node-Based para execução distribuída de workflows
 * Compatível com a estrutura existente mas adiciona camada de Enrollment
 */

import { Timestamp } from 'firebase/firestore';
import { WorkflowCondition, WorkflowActionType, WorkflowAction } from './workflow.types';

// ============================================================================
// NODE-BASED WORKFLOW DEFINITION
// ============================================================================

export type WorkflowNodeType = 'trigger' | 'action' | 'condition' | 'delay' | 'end';

/**
 * Base interface for all workflow nodes
 */
export interface WorkflowNode {
  id: string;
  type: WorkflowNodeType;
  label?: string;
  position?: { x: number; y: number }; // Para React Flow
  nextId?: string; // Próximo nó padrão na cadeia
}

/**
 * Trigger Node - Ponto de entrada do workflow
 */
export interface TriggerNode extends WorkflowNode {
  type: 'trigger';
  triggerType: string; // 'deal_created', 'deal_stage_changed', etc
  triggerConfig: Record<string, any>;
}

/**
 * Action Node - Executa uma ação (email, tarefa, update, etc)
 */
export interface ActionNode extends WorkflowNode {
  type: 'action';
  actionType: WorkflowActionType;
  actionConfig: Record<string, any>;
  // Se a ação falhar, pode ter um caminho alternativo
  errorNextId?: string;
}

/**
 * Condition Node - Branch lógico (IF/ELSE)
 */
export interface ConditionNode extends WorkflowNode {
  type: 'condition';
  conditions: WorkflowCondition[];
  operator: 'AND' | 'OR'; // Como combinar múltiplas condições
  trueNextId: string; // Caminho se TRUE
  falseNextId: string; // Caminho se FALSE
}

/**
 * Delay Node - Pausa a execução por X tempo
 */
export interface DelayNode extends WorkflowNode {
  type: 'delay';
  delayMinutes?: number;
  delayHours?: number;
  delayDays?: number;
}

/**
 * End Node - Marca fim do workflow
 */
export interface EndNode extends WorkflowNode {
  type: 'end';
}

export type AnyWorkflowNode = TriggerNode | ActionNode | ConditionNode | DelayNode | EndNode;

/**
 * Workflow Definition - O Blueprint
 */
export interface WorkflowDefinition {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;

  // Nodes organizados como Map para acesso O(1)
  nodes: Record<string, AnyWorkflowNode>;
  startNodeId: string; // ID do nó inicial (geralmente o trigger)

  // Configurações de execução
  runOnce?: boolean; // Se true, cada deal só executa uma vez
  priority?: number;

  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

// ============================================================================
// WORKFLOW ENROLLMENT - Instância de Execução
// ============================================================================

export type EnrollmentStatus =
  | 'active'    // Executando ativamente
  | 'waiting'   // Pausado em um delay
  | 'completed' // Finalizado com sucesso
  | 'failed'    // Falhou com erro
  | 'cancelled' // Cancelado manualmente
  ;

/**
 * WorkflowEnrollment - Representa UMA execução de um workflow para UM deal
 *
 * Exemplo: Deal XYZ entra no Workflow "Boas-vindas"
 * → Cria um enrollment que vai rastrear o progresso desse deal específico
 */
export interface WorkflowEnrollment {
  id: string;
  workflowId: string; // Referência ao WorkflowDefinition

  // Target - O que está sendo processado
  targetType: 'deal' | 'contact' | 'task';
  targetId: string; // ID do deal/contact/task

  // Estado atual da execução
  status: EnrollmentStatus;
  currentNodeId: string; // Em qual nó estamos agora

  // Histórico e controle de loops
  visitedNodes: string[]; // Nós já visitados (para evitar loops infinitos)
  executionPath: Array<{
    nodeId: string;
    timestamp: Timestamp;
    result?: 'success' | 'failed';
    error?: string;
  }>;

  // Delay handling
  nextExecutionAt?: Timestamp; // Quando executar próximo passo (para delays)

  // Contexto dinâmico (variáveis do workflow)
  context?: Record<string, any>; // Ex: { dealValue: 50000, contactName: "João" }

  // Metadata
  startedAt: Timestamp;
  completedAt?: Timestamp;
  lastExecutedAt?: Timestamp;

  // Error handling
  errorCount: number;
  lastError?: string;

  // Retry mechanism
  retryCount?: number;
  maxRetries?: number;
}

// ============================================================================
// EXECUTION RESULT
// ============================================================================

export interface NodeExecutionResult {
  success: boolean;
  nextNodeId?: string; // Próximo nó a executar
  error?: string;
  shouldWait?: boolean; // True se for um delay
  waitUntil?: Timestamp; // Timestamp para acordar
  context?: Record<string, any>; // Atualizações no contexto
}

// ============================================================================
// ENGINE CONFIGURATION
// ============================================================================

export interface WorkflowEngineConfig {
  maxExecutionTime: number; // Máximo tempo de execução (minutos)
  maxNodesPerExecution: number; // Máximo de nós por ciclo (evitar loops)
  enableLoopDetection: boolean; // Detectar loops infinitos
  maxRetries: number; // Máximo de retentativas em caso de erro
}

export const DEFAULT_ENGINE_CONFIG: WorkflowEngineConfig = {
  maxExecutionTime: 15, // 15 minutos (limite do Cloud Functions)
  maxNodesPerExecution: 100, // Máximo 100 nós por execução
  enableLoopDetection: true,
  maxRetries: 3,
};
