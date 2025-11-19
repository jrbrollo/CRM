import { Timestamp } from 'firebase/firestore';

/**
 * Contact status in the CRM pipeline
 */
export type ContactStatus = 'lead' | 'prospect' | 'client' | 'inactive' | 'lost';

/**
 * Contact lifecycle stage
 */
export type LifecycleStage =
  | 'subscriber'
  | 'lead'
  | 'mql'         // Marketing Qualified Lead
  | 'sql'         // Sales Qualified Lead
  | 'opportunity'
  | 'customer'
  | 'evangelist';

/**
 * Lead source
 */
export type LeadSource =
  | 'organic'
  | 'meta_ads'
  | 'google_ads'
  | 'referral'
  | 'manual';

/**
 * Contact address
 */
export interface ContactAddress {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
}

/**
 * Workflow enrollment record
 */
export interface WorkflowEnrollment {
  workflowId: string;
  enrolledAt: Timestamp;
  completedAt?: Timestamp;
  status: 'active' | 'completed' | 'failed' | 'unenrolled';
  currentStepId?: string;
}

/**
 * Contact document structure in Firestore
 */
export interface Contact {
  id: string;

  // Dados básicos
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  cpf?: string;

  // Dados profissionais
  occupation?: string;
  company?: string;
  income?: number;

  // Endereço
  address?: ContactAddress;

  // Status no CRM
  status: ContactStatus;
  leadScore: number; // 0-100
  lifecycle_stage: LifecycleStage;

  // Relacionamento
  ownerId: string; // ID do planejador responsável
  source: LeadSource;
  sourceDetails?: string;

  // Tags e segmentação
  tags: string[];
  lists: string[]; // IDs de listas

  // Tracking
  lastContactedAt?: Timestamp;
  lastActivityAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;

  // Workflow automation
  enrolledWorkflows: string[];
  workflowHistory: WorkflowEnrollment[];

  // Campos customizados
  customFields: Record<string, any>;
}

/**
 * Input type for creating a contact
 */
export interface CreateContactInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  cpf?: string;
  occupation?: string;
  company?: string;
  income?: number;
  address?: ContactAddress;
  status?: ContactStatus;
  leadScore?: number;
  lifecycle_stage?: LifecycleStage;
  ownerId: string;
  source: LeadSource;
  sourceDetails?: string;
  tags?: string[];
  lists?: string[];
  customFields?: Record<string, any>;
}

/**
 * Input type for updating a contact
 */
export interface UpdateContactInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  cpf?: string;
  occupation?: string;
  company?: string;
  income?: number;
  address?: ContactAddress;
  status?: ContactStatus;
  leadScore?: number;
  lifecycle_stage?: LifecycleStage;
  ownerId?: string;
  source?: LeadSource;
  sourceDetails?: string;
  tags?: string[];
  lists?: string[];
  lastContactedAt?: Timestamp;
  lastActivityAt?: Timestamp;
  customFields?: Record<string, any>;
}

/**
 * Filters for querying contacts
 */
export interface ContactFilters {
  status?: ContactStatus | ContactStatus[];
  lifecycle_stage?: LifecycleStage | LifecycleStage[];
  ownerId?: string;
  source?: LeadSource | LeadSource[];
  tags?: string[];
  lists?: string[];
  leadScoreMin?: number;
  leadScoreMax?: number;
  createdAfter?: Date;
  createdBefore?: Date;
  searchQuery?: string; // Search in name, email, company
}
