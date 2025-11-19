/**
 * Checklist Types
 *
 * Defines types for conditional checklists with required actions,
 * questions, and data needed to progress in workflows.
 */

import { Timestamp } from 'firebase/firestore';
import { WorkflowCondition } from './workflow.types';

/**
 * Checklist item type
 */
export type ChecklistItemType =
  | 'action'      // Action to be completed (e.g., "Send contract")
  | 'question'    // Question to be answered (e.g., "Client confirmed budget?")
  | 'data'        // Data field to be filled (e.g., "CPF", "Income")
  | 'document'    // Document to be uploaded
  | 'approval';   // Approval from someone

/**
 * Checklist item status
 */
export type ChecklistItemStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'skipped'    // Skipped due to conditional logic
  | 'blocked';   // Blocked by dependencies

/**
 * Single checklist item
 */
export interface ChecklistItem {
  id: string;
  type: ChecklistItemType;
  title: string;
  description?: string;
  required: boolean; // If true, blocks progression
  order: number;

  // Conditional logic
  condition?: WorkflowCondition; // Only show/require if condition is met
  dependsOn?: string[]; // IDs of items that must be completed first

  // Completion tracking
  status: ChecklistItemStatus;
  completedAt?: Timestamp;
  completedBy?: string; // User ID who completed

  // Type-specific data
  config: ChecklistItemConfig;
}

/**
 * Configuration specific to each item type
 */
export interface ChecklistItemConfig {
  // For 'action' type
  actionType?: 'manual' | 'automated';
  actionDetails?: string;

  // For 'question' type
  questionType?: 'yes_no' | 'multiple_choice' | 'text';
  options?: string[]; // For multiple choice
  answer?: any; // Stores the answer

  // For 'data' type
  fieldName?: string; // Name of the data field
  fieldType?: 'text' | 'number' | 'date' | 'currency' | 'cpf' | 'email' | 'phone';
  fieldValue?: any; // Stores the value
  validation?: {
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: string; // Regex pattern
  };

  // For 'document' type
  documentType?: string; // e.g., "RG", "Comprovante de Renda"
  fileUrl?: string; // URL of uploaded file
  fileName?: string;

  // For 'approval' type
  approverUserId?: string;
  approvedAt?: Timestamp;
  approvalNotes?: string;
}

/**
 * Complete checklist
 */
export interface Checklist {
  id: string;
  name: string;
  description?: string;

  // Association
  entityType: 'workflow' | 'deal' | 'contact';
  entityId: string; // ID of workflow, deal, or contact

  // Items
  items: ChecklistItem[];

  // Progress tracking
  totalItems: number;
  completedItems: number;
  requiredItems: number;
  completedRequiredItems: number;
  progressPercentage: number; // 0-100
  canProgress: boolean; // True if all required items are completed

  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

/**
 * Input for creating a checklist
 */
export interface CreateChecklistInput {
  name: string;
  description?: string;
  entityType: 'workflow' | 'deal' | 'contact';
  entityId: string;
  items: Omit<ChecklistItem, 'id' | 'status' | 'completedAt' | 'completedBy'>[];
  createdBy: string;
}

/**
 * Input for updating a checklist
 */
export interface UpdateChecklistInput {
  name?: string;
  description?: string;
  items?: ChecklistItem[];
}

/**
 * Input for updating a checklist item
 */
export interface UpdateChecklistItemInput {
  status?: ChecklistItemStatus;
  completedBy?: string;
  config?: Partial<ChecklistItemConfig>;
}

/**
 * Checklist template (reusable across workflows)
 */
export interface ChecklistTemplate {
  id: string;
  name: string;
  description?: string;
  category: string; // e.g., "Onboarding", "Sales", "Compliance"
  items: Omit<ChecklistItem, 'id' | 'status' | 'completedAt' | 'completedBy'>[];
  isPublic: boolean; // If true, available to all users
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Input for creating a checklist template
 */
export interface CreateChecklistTemplateInput {
  name: string;
  description?: string;
  category: string;
  items: Omit<ChecklistItem, 'id' | 'status' | 'completedAt' | 'completedBy'>[];
  isPublic?: boolean;
  createdBy: string;
}
