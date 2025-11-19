import { Timestamp } from 'firebase/firestore';

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
  name: string;
  contactId: string;
  amount: number;
  currency: 'BRL';

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

  // Produtos/Serviços
  products: DealProduct[];

  // Notas
  notes: string;

  // Campos customizados
  customFields: Record<string, any>;
}

/**
 * Input type for creating a deal
 */
export interface CreateDealInput {
  name: string;
  contactId: string;
  amount: number;
  pipelineId: string;
  stageId: string;
  probability?: number;
  expectedCloseDate?: Date;
  ownerId: string;
  products?: DealProduct[];
  notes?: string;
  customFields?: Record<string, any>;
}

/**
 * Input type for updating a deal
 */
export interface UpdateDealInput {
  name?: string;
  contactId?: string;
  amount?: number;
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
