import { Timestamp } from 'firebase/firestore';
import type { BranchLocation, ContactPerson } from './customFields.types';

/**
 * Deal status
 */
export type DealStatus = 'open' | 'won' | 'lost';

/**
 * Recurring period for products
 */
export type RecurringPeriod = 'monthly' | 'quarterly' | 'annual';

/**
 * Deal product/service
 */
export interface DealProduct {
  id: string;
  name: string;
  price: number;
  quantity: number;
  recurring: boolean;
  recurringPeriod?: RecurringPeriod;
}

/**
 * Deal document structure in Firestore
 */
export interface Deal {
  id: string;

  // Basic info (legacy compatibility)
  title?: string; // Legacy field
  name?: string; // New field (same as title)

  contactId?: string; // Legacy - may be empty if using contactPerson
  amount?: number; // Legacy - same as value
  value?: number; // Value in BRL
  currency?: 'BRL';

  // Pipeline
  pipelineId: string;
  stageId: string;
  probability: number; // 0-100

  // Datas importantes
  expectedCloseDate?: Timestamp;
  closedDate?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;

  // Status
  status: DealStatus;
  lostReason?: string;

  // Relacionamento
  ownerId: string;

  // Produtos/Serviços (optional)
  products?: DealProduct[];

  // Notas
  notes?: string;
  description?: string; // Same as notes

  // Company
  companyName?: string;

  // Campos específicos para Planejamento Financeiro
  sourceId?: string; // Reference to Source document
  campaignId?: string; // Reference to Campaign document
  contactPerson?: ContactPerson; // Dados completos da pessoa
  isActiveClient?: boolean; // Se já é pagante (Sim/Não)
  branch?: BranchLocation; // Filial Braúna

  // Campos customizados genéricos
  customFields?: Record<string, any>;
}

/**
 * Input type for creating a deal
 */
export interface CreateDealInput {
  // Required fields
  title: string; // Nome da negociação
  pipelineId: string; // Funil
  stageId: string; // Etapa do funil
  ownerId: string; // Who created it

  // Optional legacy compatibility
  name?: string; // Same as title
  contactId?: string; // Legacy - may be empty if using contactPerson
  amount?: number; // Legacy - same as value
  value?: number; // Valor estimado

  // Campos específicos Braúna
  sourceId?: string; // Fonte
  campaignId?: string; // Campanha
  contactPerson?: ContactPerson; // Dados da pessoa
  isActiveClient?: boolean; // Já é pagante?
  branch?: BranchLocation; // Filial Braúna

  // Optional fields
  probability?: number;
  expectedCloseDate?: Date;
  products?: DealProduct[];
  notes?: string;
  description?: string;
  companyName?: string;
  customFields?: Record<string, any>;
  status?: DealStatus;
}

/**
 * Input type for updating a deal
 */
export interface UpdateDealInput {
  title?: string;
  name?: string;
  contactId?: string;
  amount?: number;
  value?: number;
  pipelineId?: string;
  stageId?: string;
  probability?: number;
  expectedCloseDate?: Date | null;
  closedDate?: Date | null;
  status?: DealStatus;
  lostReason?: string;
  ownerId?: string;
  products?: DealProduct[];
  notes?: string;
  description?: string;
  companyName?: string;

  // Campos específicos Braúna
  sourceId?: string;
  campaignId?: string;
  contactPerson?: ContactPerson;
  isActiveClient?: boolean;
  branch?: BranchLocation;

  customFields?: Record<string, any>;
}

/**
 * Filters for querying deals
 */
export interface DealFilters {
  status?: DealStatus | DealStatus[];
  pipelineId?: string;
  stageId?: string | string[];
  ownerId?: string;
  contactId?: string;
  amountMin?: number;
  amountMax?: number;
  probabilityMin?: number;
  probabilityMax?: number;
  createdAfter?: Date;
  createdBefore?: Date;
  expectedCloseAfter?: Date;
  expectedCloseBefore?: Date;
  searchQuery?: string;
}
