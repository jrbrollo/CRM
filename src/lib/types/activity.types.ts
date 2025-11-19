import { Timestamp } from 'firebase/firestore';

/**
 * Activity types
 */
export type ActivityType =
  | 'note'
  | 'email'
  | 'call'
  | 'meeting'
  | 'task'
  | 'whatsapp'
  | 'workflow_action';

/**
 * Activity status (for tasks)
 */
export type ActivityStatus = 'pending' | 'completed' | 'cancelled';

/**
 * Activity document structure in Firestore
 */
export interface Activity {
  id: string;
  type: ActivityType;

  // Relacionamentos
  contactId?: string;
  dealId?: string;
  ownerId: string;

  // Conteúdo
  subject?: string;
  description: string;

  // Status (para tasks)
  status?: ActivityStatus;
  dueDate?: Timestamp;
  completedAt?: Timestamp;

  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;

  // Workflow tracking
  workflowId?: string;
  workflowStepId?: string;
  automationTriggered: boolean;
}

/**
 * Input type for creating an activity
 */
export interface CreateActivityInput {
  type: ActivityType;
  contactId?: string;
  dealId?: string;
  ownerId: string;
  subject?: string;
  description: string;
  status?: ActivityStatus;
  dueDate?: Date;
  workflowId?: string;
  workflowStepId?: string;
  automationTriggered?: boolean;
}

/**
 * Input type for updating an activity
 */
export interface UpdateActivityInput {
  subject?: string;
  description?: string;
  status?: ActivityStatus;
  dueDate?: Date | null;
  completedAt?: Date | null;
}

/**
 * Filters for querying activities
 */
export interface ActivityFilters {
  type?: ActivityType | ActivityType[];
  contactId?: string;
  dealId?: string;
  ownerId?: string;
  status?: ActivityStatus;
  workflowId?: string;
  automationTriggered?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
  dueDateAfter?: Date;
  dueDateBefore?: Date;
}
