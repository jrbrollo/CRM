import { Timestamp } from 'firebase/firestore';

/**
 * Automation log status
 */
export type AutomationLogStatus = 'success' | 'failed' | 'pending' | 'retrying';

/**
 * Automation log document in Firestore
 */
export interface AutomationLog {
  id: string;
  workflowId: string;
  workflowStepId: string;
  contactId: string;

  status: AutomationLogStatus;
  errorMessage?: string;
  retryCount: number;

  executedAt: Timestamp;

  metadata: {
    stepType: string;
    stepConfig: any;
    executionTime: number; // Execution time in milliseconds
    [key: string]: any;
  };
}

/**
 * Email template
 */
export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string; // HTML content
  variables: string[]; // e.g., ['contact.firstName', 'deal.amount']
  category: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Input type for creating an email template
 */
export interface CreateEmailTemplateInput {
  name: string;
  subject: string;
  body: string;
  variables?: string[];
  category: string;
}

/**
 * Input type for updating an email template
 */
export interface UpdateEmailTemplateInput {
  name?: string;
  subject?: string;
  body?: string;
  variables?: string[];
  category?: string;
}

/**
 * List (for contact segmentation)
 */
export interface ContactList {
  id: string;
  name: string;
  description?: string;
  contactIds: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Input type for creating a list
 */
export interface CreateListInput {
  name: string;
  description?: string;
  contactIds?: string[];
}

/**
 * Input type for updating a list
 */
export interface UpdateListInput {
  name?: string;
  description?: string;
  contactIds?: string[];
}
