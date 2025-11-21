/**
 * Workflow Types - Complete System
 *
 * Sistema completo de workflows com triggers, conditions e actions
 */

import { Timestamp } from 'firebase/firestore';
import { TaskType, TaskPriority } from './task.types';

// ============================================================================
// TRIGGER TYPES
// ============================================================================

export type WorkflowTriggerType =
  // Deal-based triggers
  | 'deal_created' // Deal criado
  | 'deal_updated' // Deal atualizado
  | 'deal_stage_changed' // Deal mudou de etapa
  | 'deal_won' // Deal ganho
  | 'deal_lost' // Deal perdido
  | 'deal_stale' // Deal sem atividade há X dias
  | 'deal_value_changed' // Valor do deal mudou
  | 'deal_assigned' // Deal atribuído a alguém
  // Task-based triggers
  | 'task_created' // Tarefa criada
  | 'task_completed' // Tarefa concluída
  | 'task_overdue' // Tarefa atrasada
  | 'task_not_completed' // Tarefa não completada no prazo (SLA breach)
  // Time-based triggers
  | 'scheduled' // Agendado (dia/hora específica)
  | 'recurring' // Recorrente (diário, semanal, mensal)
  // User-based triggers
  | 'user_created' // Usuário criado
  | 'user_status_changed' // Status do usuário mudou (férias, etc)
  // Custom
  | 'manual'; // Trigger manual

export interface WorkflowTrigger {
  type: WorkflowTriggerType;
  config: WorkflowTriggerConfig;
}

export interface WorkflowTriggerConfig {
  // For deal_stage_changed
  fromStageId?: string;
  toStageId?: string;
  pipelineId?: string;

  // For deal_lost
  lostReason?: string;

  // For deal_stale
  daysInactive?: number;

  // For task_not_completed (SLA breach)
  taskType?: TaskType;
  slaMinutes?: number; // SLA em minutos

  // For scheduled
  scheduledDate?: Date;
  scheduledTime?: string; // HH:mm format

  // For recurring
  recurringPattern?: 'daily' | 'weekly' | 'monthly';
  recurringDay?: number; // Dia do mês (1-31) ou dia da semana (0-6)
  recurringTime?: string; // HH:mm format

  // For user_status_changed
  userStatus?: 'active' | 'inactive' | 'on_leave';

  // Generic metadata
  [key: string]: any;
}

// ============================================================================
// CONDITION TYPES
// ============================================================================

export interface WorkflowCondition {
  field: string; // Ex: 'sourceId', 'value', 'contactAttempts'
  operator: WorkflowConditionOperator;
  value: any;
}

export type WorkflowConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'greater_than'
  | 'less_than'
  | 'greater_than_or_equal'
  | 'less_than_or_equal'
  | 'in'
  | 'not_in'
  | 'is_empty'
  | 'is_not_empty';

// ============================================================================
// ACTION TYPES
// ============================================================================

export type WorkflowActionType =
  // Task actions
  | 'create_task' // Criar tarefa
  | 'update_task' // Atualizar tarefa
  | 'complete_task' // Completar tarefa
  // Deal actions
  | 'update_deal' // Atualizar deal
  | 'assign_deal' // Atribuir deal
  | 'create_deal' // Criar novo deal (para transições entre funis)
  | 'move_deal_stage' // Mover deal para outra etapa
  | 'mark_deal_won' // Marcar deal como ganho
  | 'mark_deal_lost' // Marcar deal como perdido
  // Assignment actions
  | 'assign_round_robin' // Atribuir por round-robin
  | 'assign_by_criteria' // Atribuir baseado em critérios
  | 'reassign_deals' // Reatribuir deals (para férias/ausência)
  // Notification actions
  | 'send_notification' // Enviar notificação in-app
  | 'send_email' // Enviar email
  | 'send_whatsapp' // Enviar WhatsApp
  // Tracking actions
  | 'increment_counter' // Incrementar contador (ex: contactAttempts)
  | 'set_property' // Definir propriedade customizada
  | 'log_activity' // Registrar atividade
  | 'track_sla_violation' // Registrar violação de SLA
  // Integration actions
  | 'webhook' // Chamar webhook
  | 'create_calendar_event' // Criar evento no calendário
  // Workflow control
  | 'wait' // Esperar X tempo antes da próxima ação
  | 'conditional' // Ação condicional (if/then)
  | 'stop_workflow'; // Parar execução do workflow

export interface WorkflowAction {
  type: WorkflowActionType;
  config: WorkflowActionConfig;
  delay?: number; // Delay em minutos antes de executar esta ação
  conditions?: WorkflowCondition[]; // Condições para executar esta ação
}

export interface WorkflowActionConfig {
  // For create_task
  taskTitle?: string;
  taskDescription?: string;
  taskType?: TaskType;
  taskPriority?: TaskPriority;
  taskDueInMinutes?: number; // Prazo em minutos a partir de agora
  taskDueInHours?: number; // Prazo em horas
  taskDueInDays?: number; // Prazo em dias
  taskAssignTo?: 'deal_owner' | 'team_leader' | 'specific_user' | 'round_robin';
  taskAssignToUserId?: string; // Se taskAssignTo = 'specific_user'
  taskTags?: string[];

  // For update_deal
  dealUpdates?: Record<string, any>; // Campos para atualizar
  incrementContactAttempts?: boolean;
  updateLastActivityAt?: boolean;
  setClientStatus?: string;
  setSlaViolation?: boolean;

  // For assign_deal / assign_round_robin
  assignTo?: 'specific_user' | 'round_robin' | 'team_leader';
  assignToUserId?: string;
  assignToTeamId?: string;

  // For create_deal
  newDealTitle?: string;
  newDealPipelineId?: string;
  newDealStageId?: string;
  copyFieldsFromOriginal?: string[]; // Campos para copiar do deal original
  linkDeals?: boolean; // Se true, cria previousDealId/nextDealId links

  // For move_deal_stage
  targetStageId?: string;

  // For mark_deal_lost
  lostReason?: string;

  // For send_notification
  notificationTitle?: string;
  notificationMessage?: string;
  notificationPriority?: 'low' | 'medium' | 'high' | 'urgent';
  notifyUsers?: ('deal_owner' | 'team_leader' | 'all_team' | 'specific_user')[];
  notifyUserIds?: string[];

  // For send_email
  emailTemplateId?: string;
  emailTo?: 'contact' | 'deal_owner' | 'specific_email';
  emailToAddress?: string;
  emailSubject?: string;
  emailBody?: string;
  emailVariables?: Record<string, any>;

  // For send_whatsapp
  whatsappTo?: 'contact' | 'specific_number';
  whatsappNumber?: string;
  whatsappMessage?: string;
  whatsappVariables?: Record<string, any>;

  // For increment_counter
  counterField?: string; // Ex: 'contactAttempts', 'slaViolations'
  incrementBy?: number; // Default 1

  // For set_property
  propertyField?: string;
  propertyValue?: any;

  // For track_sla_violation
  slaType?: string;
  slaExpectedMinutes?: number;

  // For webhook
  webhookUrl?: string;
  webhookMethod?: 'GET' | 'POST' | 'PUT';
  webhookBody?: Record<string, any>;
  webhookHeaders?: Record<string, string>;

  // For create_calendar_event
  calendarEventTitle?: string;
  calendarEventDescription?: string;
  calendarEventDate?: string;
  calendarEventDuration?: number; // em minutos

  // For wait
  waitMinutes?: number;
  waitHours?: number;
  waitDays?: number;

  // For conditional
  ifConditions?: WorkflowCondition[];
  thenActions?: WorkflowAction[];
  elseActions?: WorkflowAction[];

  // Generic metadata
  [key: string]: any;
}

// ============================================================================
// WORKFLOW DOCUMENT
// ============================================================================

export interface Workflow {
  id: string;

  // Basic info
  name: string;
  description?: string;
  category:
    | 'distribution' // Distribuição de leads
    | 'progression' // Progressão de funil
    | 'sales' // Vendas
    | 'post_sales' // Pós-venda
    | 'engagement' // Reengajamento
    | 'monitoring' // Monitoramento
    | 'internal'; // Gestão interna

  // Status
  isActive: boolean;

  // Trigger
  trigger: WorkflowTrigger;

  // Conditions (all must match para workflow executar)
  conditions?: WorkflowCondition[];

  // Actions (executadas em sequência)
  actions: WorkflowAction[];

  // Execution settings
  runOnce?: boolean; // Se true, executa apenas uma vez por deal
  priority?: number; // Workflows com maior prioridade executam primeiro

  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  lastExecutedAt?: Timestamp;
  executionCount?: number;
}

export interface CreateWorkflowInput {
  name: string;
  description?: string;
  category: Workflow['category'];
  isActive?: boolean;
  trigger: WorkflowTrigger;
  conditions?: WorkflowCondition[];
  actions: WorkflowAction[];
  runOnce?: boolean;
  priority?: number;
  createdBy: string;
}

export interface UpdateWorkflowInput {
  name?: string;
  description?: string;
  category?: Workflow['category'];
  isActive?: boolean;
  trigger?: WorkflowTrigger;
  conditions?: WorkflowCondition[];
  actions?: WorkflowAction[];
  runOnce?: boolean;
  priority?: number;
}

// ============================================================================
// WORKFLOW EXECUTION LOG
// ============================================================================

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  workflowName: string;

  // Context
  dealId?: string;
  taskId?: string;
  userId?: string;

  // Execution status
  status: 'pending' | 'running' | 'completed' | 'failed' | 'partial';
  startedAt: Timestamp;
  completedAt?: Timestamp;

  // Results
  actionsExecuted: number;
  actionsFailed: number;
  errors?: string[];

  // Logs
  logs: WorkflowExecutionLog[];
}

export interface WorkflowExecutionLog {
  timestamp: Timestamp;
  action: WorkflowActionType;
  status: 'success' | 'failed';
  message: string;
  error?: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// HELPER LABELS
// ============================================================================

export const WORKFLOW_TRIGGER_LABELS: Record<WorkflowTriggerType, string> = {
  deal_created: 'Deal Criado',
  deal_updated: 'Deal Atualizado',
  deal_stage_changed: 'Mudança de Etapa',
  deal_won: 'Deal Ganho',
  deal_lost: 'Deal Perdido',
  deal_stale: 'Deal Parado',
  deal_value_changed: 'Valor Alterado',
  deal_assigned: 'Deal Atribuído',
  task_created: 'Tarefa Criada',
  task_completed: 'Tarefa Concluída',
  task_overdue: 'Tarefa Atrasada',
  task_not_completed: 'Tarefa Não Concluída (SLA)',
  scheduled: 'Agendado',
  recurring: 'Recorrente',
  user_created: 'Usuário Criado',
  user_status_changed: 'Status do Usuário Mudou',
  manual: 'Manual',
};

export const WORKFLOW_ACTION_LABELS: Record<WorkflowActionType, string> = {
  create_task: 'Criar Tarefa',
  update_task: 'Atualizar Tarefa',
  complete_task: 'Completar Tarefa',
  update_deal: 'Atualizar Deal',
  assign_deal: 'Atribuir Deal',
  create_deal: 'Criar Deal',
  move_deal_stage: 'Mover para Etapa',
  mark_deal_won: 'Marcar como Ganho',
  mark_deal_lost: 'Marcar como Perdido',
  assign_round_robin: 'Atribuir (Round-Robin)',
  assign_by_criteria: 'Atribuir (Critérios)',
  reassign_deals: 'Reatribuir Deals',
  send_notification: 'Enviar Notificação',
  send_email: 'Enviar Email',
  send_whatsapp: 'Enviar WhatsApp',
  increment_counter: 'Incrementar Contador',
  set_property: 'Definir Propriedade',
  log_activity: 'Registrar Atividade',
  track_sla_violation: 'Registrar Violação de SLA',
  webhook: 'Chamar Webhook',
  create_calendar_event: 'Criar Evento no Calendário',
  wait: 'Aguardar',
  conditional: 'Condicional (If/Then)',
  stop_workflow: 'Parar Workflow',
};

export const WORKFLOW_CATEGORY_LABELS: Record<Workflow['category'], string> = {
  distribution: 'Distribuição de Leads',
  progression: 'Progressão de Funil',
  sales: 'Vendas',
  post_sales: 'Pós-Venda',
  engagement: 'Reengajamento',
  monitoring: 'Monitoramento',
  internal: 'Gestão Interna',
};

// ============================================================================
// WORKFLOW BUILDER TYPES (Graph Format)
// ============================================================================

/**
 * Graph-based workflow node (new format for visual workflow builder)
 */
export interface WorkflowGraphNode {
  id: string;
  type: WorkflowStepType;
  nextId?: string; // For linear nodes (action, delay, trigger)
  trueNextId?: string; // For condition nodes (true path)
  falseNextId?: string; // For condition nodes (false path)
  config: StepConfig;
}

/**
 * Graph structure for visual workflows
 */
export interface WorkflowGraph {
  nodes: Record<string, WorkflowGraphNode>;
  triggerNodeId: string;
}

/**
 * Step types for workflow builder
 */
export type WorkflowStepType =
  // Deal Actions
  | 'assign_round_robin'
  | 'create_deal'
  | 'update_deal'
  | 'move_deal_stage'
  // Task Actions
  | 'create_task'
  | 'complete_task'
  // Notification Actions
  | 'send_notification'
  | 'send_email'
  | 'send_whatsapp'
  // Tracking Actions
  | 'increment_counter'
  | 'track_sla_violation'
  | 'log_activity'
  // Control Actions
  | 'wait'
  | 'conditional'
  // Integration
  | 'webhook';

/**
 * Step configuration (data edited in property editor)
 */
export interface StepConfig {
  // Delay/Wait config
  delayMinutes?: number;
  delayHours?: number;
  delayDays?: number;

  // Email config
  emailSubject?: string;
  emailBody?: string;
  fromName?: string;
  replyTo?: string;

  // Task config
  taskTitle?: string;
  taskDescription?: string;
  taskType?: TaskType;
  taskPriority?: TaskPriority;
  taskDueInMinutes?: number;
  taskDueInHours?: number;
  taskDueInDays?: number;
  assignToUserId?: string;

  // WhatsApp config
  whatsappMessage?: string;

  // Webhook config
  webhookUrl?: string;
  webhookMethod?: 'GET' | 'POST';
  webhookBody?: string;

  // Round-robin config
  assignToTeamId?: string;

  // Create deal config
  dealTitle?: string;
  dealPipelineId?: string;
  dealStageId?: string;
  dealValue?: number;
  linkDeals?: boolean;
  copyFields?: boolean;

  // Update deal config
  updateFields?: string; // JSON string

  // Move stage config
  targetStageId?: string;

  // Notification config
  notificationTitle?: string;
  notificationMessage?: string;
  notificationType?: string;
  notificationPriority?: string;
  notifyUserId?: string;
  notifyTeamLeader?: boolean;

  // Counter config
  counterField?: string;
  incrementBy?: number;

  // SLA config
  violationType?: string;
  notifyLeader?: boolean;

  // Activity log config
  activityType?: string;
  activityNotes?: string;

  // Conditional config
  field?: string;
  operator?: string;
  value?: any;

  // Generic metadata
  [key: string]: any;
}

/**
 * Workflow step (legacy sequential format)
 */
export interface WorkflowStep {
  type: WorkflowStepType;
  config: StepConfig;
  order: number;
}

/**
 * Enrollment settings
 */
export interface EnrollmentSettings {
  allowReEnrollment: boolean;
  suppressForContacts: string[];
}

/**
 * Trigger with conditions (builder format)
 */
export interface WorkflowBuilderTrigger {
  type: WorkflowTriggerType;
  conditions: {
    operator: 'AND' | 'OR';
    filters: any[];
  };
}

/**
 * Create workflow input (workflow builder format)
 * This extends the base format with graph support
 */
export interface CreateWorkflowBuilderInput {
  name: string;
  description?: string;
  status: 'draft' | 'active';
  trigger: WorkflowBuilderTrigger;
  graph?: WorkflowGraph; // NEW: Graph format
  steps: WorkflowStep[]; // Legacy format (for compatibility)
  enrollmentSettings: EnrollmentSettings;
  createdBy: string;
}
