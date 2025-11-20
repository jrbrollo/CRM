/**
 * Task Types
 *
 * Sistema de tarefas vinculadas a deals, contatos e usuários
 */

import { Timestamp } from 'firebase/firestore';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'overdue';
export type TaskType =
  | 'call' // Ligação
  | 'email' // Email
  | 'meeting' // Reunião
  | 'follow_up' // Follow-up
  | 'document' // Preparar documento
  | 'review' // Revisar algo
  | 'other'; // Outro

export interface Task {
  id: string;

  // Basic info
  title: string;
  description?: string;
  type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;

  // Assignment
  assignedTo: string; // User ID do responsável
  createdBy: string; // User ID de quem criou

  // Relations
  dealId?: string; // Deal relacionado
  contactId?: string; // Contact relacionado
  workflowId?: string; // Se foi criada por workflow

  // Timing
  dueDate?: Timestamp; // Prazo
  reminderDate?: Timestamp; // Lembrete antes do prazo
  completedAt?: Timestamp; // Quando foi concluída

  // SLA tracking
  createdAt: Timestamp;
  updatedAt: Timestamp;
  slaViolated?: boolean; // Se violou SLA
  slaViolatedAt?: Timestamp;

  // Metadata
  notes?: string; // Notas adicionadas durante execução
  outcome?: string; // Resultado da tarefa
  tags?: string[];
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  type: TaskType;
  priority: TaskPriority;
  assignedTo: string;
  createdBy: string;
  dealId?: string;
  contactId?: string;
  workflowId?: string;
  dueDate?: Date;
  reminderDate?: Date;
  tags?: string[];
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  type?: TaskType;
  priority?: TaskPriority;
  status?: TaskStatus;
  assignedTo?: string;
  dueDate?: Date;
  reminderDate?: Date;
  notes?: string;
  outcome?: string;
  tags?: string[];
}

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  urgent: 'Urgente',
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  pending: 'Pendente',
  in_progress: 'Em Andamento',
  completed: 'Concluída',
  cancelled: 'Cancelada',
  overdue: 'Atrasada',
};

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  call: 'Ligação',
  email: 'Email',
  meeting: 'Reunião',
  follow_up: 'Follow-up',
  document: 'Documento',
  review: 'Revisão',
  other: 'Outro',
};
