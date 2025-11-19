import { Timestamp } from 'firebase/firestore';

/**
 * Workflow status
 */
export type WorkflowStatus = 'draft' | 'active' | 'paused' | 'archived';

/**
 * Workflow trigger types
 */
export type WorkflowTriggerType =
  | 'contact_created'
  | 'contact_property_change'
  | 'deal_stage_change'
  | 'form_submission'
  | 'email_event'
  | 'manual_enrollment'
  | 'scheduled';

/**
 * Workflow condition operator
 */
export type ConditionOperator = 'AND' | 'OR';

/**
 * Filter operator for conditions
 */
export type FilterOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'greater_than'
  | 'less_than'
  | 'is_known'
  | 'is_unknown'
  | 'is_member_of_list'
  | 'not_member_of_list';

/**
 * Single filter in a condition
 */
export interface WorkflowFilter {
  property: string; // e.g., 'status', 'tags', 'customFields.income'
  operator: FilterOperator;
  value: any;
}

/**
 * Workflow condition (can contain multiple filters)
 */
export interface WorkflowCondition {
  operator: ConditionOperator;
  filters: WorkflowFilter[];
}

/**
 * Schedule configuration for scheduled triggers
 */
export interface WorkflowSchedule {
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string; // HH:mm format
  dayOfWeek?: number; // 0-6 (Sunday to Saturday)
  dayOfMonth?: number; // 1-31
}

/**
 * Workflow trigger configuration
 */
export interface WorkflowTrigger {
  type: WorkflowTriggerType;
  conditions: WorkflowCondition;
  schedule?: WorkflowSchedule;
}

/**
 * Workflow step types
 */
export type WorkflowStepType =
  | 'delay'
  | 'send_email'
  | 'send_whatsapp'
  | 'create_task'
  | 'update_property'
  | 'branch'
  | 'webhook'
  | 'add_to_list'
  | 'remove_from_list';

/**
 * Delay configuration
 */
export interface DelayConfig {
  delayType: 'duration' | 'until_date' | 'until_event';
  duration?: {
    value: number;
    unit: 'minutes' | 'hours' | 'days' | 'weeks';
  };
  untilDate?: Timestamp;
  untilEvent?: string;
}

/**
 * Email configuration
 */
export interface EmailConfig {
  emailTemplateId?: string;
  emailSubject?: string;
  emailBody?: string;
  fromName?: string;
  replyTo?: string;
}

/**
 * WhatsApp configuration
 */
export interface WhatsAppConfig {
  whatsappTemplateId?: string;
  whatsappMessage?: string;
}

/**
 * Task configuration
 */
export interface TaskConfig {
  taskTitle: string;
  taskDescription?: string;
  taskType?: string;
  assignToOwnerId?: boolean;
  assignToUserId?: string;
  taskDueIn?: {
    value: number;
    unit: 'days' | 'weeks';
  };
}

/**
 * Property update configuration
 */
export interface UpdatePropertyConfig {
  propertyName: string;
  propertyValue: any;
}

/**
 * Branch configuration
 */
export interface BranchConfig {
  branches: Array<{
    id: string;
    condition: WorkflowCondition;
    steps: WorkflowStep[];
  }>;
}

/**
 * Webhook configuration
 */
export interface WebhookConfig {
  webhookUrl: string;
  webhookMethod: 'GET' | 'POST';
  webhookHeaders?: Record<string, string>;
  webhookBody?: string;
}

/**
 * List configuration
 */
export interface ListConfig {
  listId: string;
}

/**
 * Step configuration (union type)
 */
export type StepConfig =
  | DelayConfig
  | EmailConfig
  | WhatsAppConfig
  | TaskConfig
  | UpdatePropertyConfig
  | BranchConfig
  | WebhookConfig
  | ListConfig;

/**
 * Workflow step
 */
export interface WorkflowStep {
  id: string;
  type: WorkflowStepType;
  order: number;
  config: StepConfig;
  executionCount: number;
  lastExecutedAt?: Timestamp;
}

/**
 * Enrollment settings
 */
export interface EnrollmentSettings {
  allowReEnrollment: boolean;
  reEnrollmentTrigger?: 'property_change' | 'time_based';
  suppressForContacts: string[]; // Contact IDs to never enroll
  goalCriteria?: WorkflowCondition; // Auto-unenroll when goal is met
}

/**
 * Workflow statistics
 */
export interface WorkflowStats {
  totalEnrolled: number;
  currentlyEnrolled: number;
  completed: number;
  goalsMet: number;
}

/**
 * Workflow document structure in Firestore
 */
export interface Workflow {
  id: string;
  name: string;
  description: string;
  status: WorkflowStatus;
  trigger: WorkflowTrigger;
  steps: WorkflowStep[];
  enrollmentSettings: EnrollmentSettings;
  stats: WorkflowStats;

  // Metadata
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastExecutedAt?: Timestamp;
}

/**
 * Input type for creating a workflow
 */
export interface CreateWorkflowInput {
  name: string;
  description: string;
  status?: WorkflowStatus;
  trigger: WorkflowTrigger;
  steps: Omit<WorkflowStep, 'id' | 'executionCount' | 'lastExecutedAt'>[];
  enrollmentSettings?: Partial<EnrollmentSettings>;
  createdBy: string;
}

/**
 * Input type for updating a workflow
 */
export interface UpdateWorkflowInput {
  name?: string;
  description?: string;
  status?: WorkflowStatus;
  trigger?: WorkflowTrigger;
  steps?: WorkflowStep[];
  enrollmentSettings?: Partial<EnrollmentSettings>;
}

/**
 * Workflow enrollment status
 */
export type EnrollmentStatus = 'active' | 'completed' | 'failed' | 'unenrolled';

/**
 * Contact enrollment in a workflow
 */
export interface WorkflowEnrollment {
  id: string;
  workflowId: string;
  contactId: string;
  status: EnrollmentStatus;
  currentStepId?: string;
  currentStepIndex: number;
  enrolledAt: Timestamp;
  completedAt?: Timestamp;
  failedAt?: Timestamp;
  unenrolledAt?: Timestamp;
  metadata: Record<string, any>;
}
