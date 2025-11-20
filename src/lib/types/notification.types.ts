/**
 * Notification Types
 *
 * Sistema de notificações in-app, email e integrações
 */

import { Timestamp } from 'firebase/firestore';

export type NotificationType =
  | 'task_assigned' // Tarefa atribuída
  | 'task_overdue' // Tarefa atrasada
  | 'deal_assigned' // Deal atribuído
  | 'deal_won' // Deal ganho
  | 'deal_lost' // Deal perdido
  | 'deal_stale' // Deal parado
  | 'sla_violation' // Violação de SLA
  | 'team_alert' // Alerta para o time
  | 'performance_alert' // Alerta de performance
  | 'workflow_executed' // Workflow executado
  | 'custom'; // Notificação customizada

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';
export type NotificationStatus = 'unread' | 'read' | 'archived';

export interface Notification {
  id: string;

  // Recipient
  userId: string; // Quem recebe

  // Content
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  status: NotificationStatus;

  // Context
  dealId?: string;
  taskId?: string;
  workflowId?: string;
  relatedUserId?: string; // Outro usuário relacionado

  // Actions
  actionLabel?: string; // Ex: "Ver Deal", "Ver Tarefa"
  actionUrl?: string; // URL para ir ao clicar

  // Metadata
  metadata?: Record<string, any>;

  // Timestamps
  createdAt: Timestamp;
  readAt?: Timestamp;
  archivedAt?: Timestamp;
}

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  priority?: NotificationPriority;
  dealId?: string;
  taskId?: string;
  workflowId?: string;
  relatedUserId?: string;
  actionLabel?: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string; // HTML or markdown
  variables: string[]; // Ex: ['clientName', 'plannerName', 'meetingDate']
  category: 'lead' | 'client' | 'internal' | 'automation';
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface WhatsAppMessage {
  id: string;
  to: string; // Phone number
  message: string;
  dealId?: string;
  workflowId?: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  sentAt?: Timestamp;
  deliveredAt?: Timestamp;
  failedReason?: string;
  createdAt: Timestamp;
}

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  task_assigned: 'Tarefa Atribuída',
  task_overdue: 'Tarefa Atrasada',
  deal_assigned: 'Deal Atribuído',
  deal_won: 'Deal Ganho',
  deal_lost: 'Deal Perdido',
  deal_stale: 'Deal Parado',
  sla_violation: 'Violação de SLA',
  team_alert: 'Alerta do Time',
  performance_alert: 'Alerta de Performance',
  workflow_executed: 'Workflow Executado',
  custom: 'Personalizada',
};
