/**
 * Zod validation schemas for Contact entity
 */

import { z } from 'zod';

/**
 * Brazilian phone number regex: (99) 99999-9999 or (99) 9999-9999
 */
const phoneRegex = /^\(\d{2}\) \d{4,5}-\d{4}$/;

/**
 * Brazilian CPF regex: 999.999.999-99
 */
const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;

/**
 * Brazilian ZIP code regex: 99999-999
 */
const zipCodeRegex = /^\d{5}-\d{3}$/;

/**
 * Contact address schema
 */
export const contactAddressSchema = z.object({
  street: z.string().min(1, 'Rua é obrigatória'),
  number: z.string().min(1, 'Número é obrigatório'),
  complement: z.string().optional(),
  neighborhood: z.string().min(1, 'Bairro é obrigatório'),
  city: z.string().min(1, 'Cidade é obrigatória'),
  state: z.string().length(2, 'Estado deve ter 2 letras (ex: SP)'),
  zipCode: z
    .string()
    .regex(zipCodeRegex, 'CEP inválido. Formato: 99999-999'),
});

/**
 * Create contact schema
 */
export const createContactSchema = z.object({
  firstName: z.string().min(1, 'Nome é obrigatório').max(100),
  lastName: z.string().min(1, 'Sobrenome é obrigatório').max(100),
  email: z.string().email('Email inválido'),
  phone: z
    .string()
    .regex(phoneRegex, 'Telefone inválido. Formato: (99) 99999-9999'),
  cpf: z
    .string()
    .regex(cpfRegex, 'CPF inválido. Formato: 999.999.999-99')
    .optional(),

  // Dados profissionais
  occupation: z.string().max(100).optional(),
  company: z.string().max(100).optional(),
  income: z.number().min(0, 'Renda deve ser maior ou igual a zero').optional(),

  // Endereço
  address: contactAddressSchema.optional(),

  // CRM Status
  status: z.enum(['lead', 'prospect', 'client', 'inactive', 'lost']).optional(),
  leadScore: z
    .number()
    .min(0, 'Lead score mínimo é 0')
    .max(100, 'Lead score máximo é 100')
    .optional(),
  lifecycle_stage: z
    .enum([
      'subscriber',
      'lead',
      'mql',
      'sql',
      'opportunity',
      'customer',
      'evangelist',
    ])
    .optional(),

  // Relacionamento
  ownerId: z.string().min(1, 'ID do responsável é obrigatório'),
  source: z.enum(['organic', 'meta_ads', 'google_ads', 'referral', 'manual']),
  sourceDetails: z.string().max(255).optional(),

  // Tags e segmentação
  tags: z.array(z.string()).optional(),
  lists: z.array(z.string()).optional(),

  // Campos customizados
  customFields: z.record(z.any()).optional(),
});

/**
 * Update contact schema (all fields optional)
 */
export const updateContactSchema = createContactSchema.partial();

/**
 * Contact filters schema
 */
export const contactFiltersSchema = z.object({
  status: z
    .union([
      z.enum(['lead', 'prospect', 'client', 'inactive', 'lost']),
      z.array(z.enum(['lead', 'prospect', 'client', 'inactive', 'lost'])),
    ])
    .optional(),
  lifecycle_stage: z
    .union([
      z.enum([
        'subscriber',
        'lead',
        'mql',
        'sql',
        'opportunity',
        'customer',
        'evangelist',
      ]),
      z.array(
        z.enum([
          'subscriber',
          'lead',
          'mql',
          'sql',
          'opportunity',
          'customer',
          'evangelist',
        ])
      ),
    ])
    .optional(),
  ownerId: z.string().optional(),
  source: z
    .union([
      z.enum(['organic', 'meta_ads', 'google_ads', 'referral', 'manual']),
      z.array(
        z.enum(['organic', 'meta_ads', 'google_ads', 'referral', 'manual'])
      ),
    ])
    .optional(),
  tags: z.array(z.string()).optional(),
  lists: z.array(z.string()).optional(),
  leadScoreMin: z.number().min(0).max(100).optional(),
  leadScoreMax: z.number().min(0).max(100).optional(),
  createdAfter: z.date().optional(),
  createdBefore: z.date().optional(),
  searchQuery: z.string().optional(),
});

/**
 * Type exports (inferred from schemas)
 */
export type CreateContactInput = z.infer<typeof createContactSchema>;
export type UpdateContactInput = z.infer<typeof updateContactSchema>;
export type ContactFilters = z.infer<typeof contactFiltersSchema>;
