/**
 * Zod validation schemas for Deal entity
 */

import { z } from 'zod';

/**
 * Deal product schema
 */
export const dealProductSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Nome do produto é obrigatório'),
  price: z.number().min(0, 'Preço deve ser maior ou igual a zero'),
  quantity: z.number().int().min(1, 'Quantidade mínima é 1'),
  recurring: z.boolean(),
  recurringPeriod: z.enum(['monthly', 'quarterly', 'annual']).optional(),
});

/**
 * Create deal schema
 */
export const createDealSchema = z.object({
  name: z.string().min(1, 'Nome do negócio é obrigatório').max(255),
  contactId: z.string().min(1, 'ID do contato é obrigatório'),
  amount: z.number().min(0, 'Valor deve ser maior ou igual a zero'),
  pipelineId: z.string().min(1, 'ID do pipeline é obrigatório'),
  stageId: z.string().min(1, 'ID do estágio é obrigatório'),
  probability: z
    .number()
    .min(0, 'Probabilidade mínima é 0%')
    .max(100, 'Probabilidade máxima é 100%')
    .optional(),
  expectedCloseDate: z.date().optional(),
  ownerId: z.string().min(1, 'ID do responsável é obrigatório'),
  products: z.array(dealProductSchema).optional(),
  notes: z.string().optional(),
  customFields: z.record(z.any()).optional(),
});

/**
 * Update deal schema (all fields optional)
 */
export const updateDealSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  contactId: z.string().optional(),
  amount: z.number().min(0).optional(),
  pipelineId: z.string().optional(),
  stageId: z.string().optional(),
  probability: z.number().min(0).max(100).optional(),
  expectedCloseDate: z.date().nullable().optional(),
  closedDate: z.date().nullable().optional(),
  status: z.enum(['open', 'won', 'lost']).optional(),
  lostReason: z.string().optional(),
  ownerId: z.string().optional(),
  products: z.array(dealProductSchema).optional(),
  notes: z.string().optional(),
  customFields: z.record(z.any()).optional(),
});

/**
 * Deal filters schema
 */
export const dealFiltersSchema = z.object({
  status: z
    .union([
      z.enum(['open', 'won', 'lost']),
      z.array(z.enum(['open', 'won', 'lost'])),
    ])
    .optional(),
  pipelineId: z.string().optional(),
  stageId: z.union([z.string(), z.array(z.string())]).optional(),
  ownerId: z.string().optional(),
  contactId: z.string().optional(),
  amountMin: z.number().min(0).optional(),
  amountMax: z.number().min(0).optional(),
  probabilityMin: z.number().min(0).max(100).optional(),
  probabilityMax: z.number().min(0).max(100).optional(),
  createdAfter: z.date().optional(),
  createdBefore: z.date().optional(),
  expectedCloseAfter: z.date().optional(),
  expectedCloseBefore: z.date().optional(),
  searchQuery: z.string().optional(),
});

/**
 * Type exports (inferred from schemas)
 */
export type CreateDealInput = z.infer<typeof createDealSchema>;
export type UpdateDealInput = z.infer<typeof updateDealSchema>;
export type DealFilters = z.infer<typeof dealFiltersSchema>;
export type DealProduct = z.infer<typeof dealProductSchema>;
