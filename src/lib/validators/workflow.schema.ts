/**
 * Zod validation schemas for Workflow entity
 */

import { z } from 'zod';

/**
 * Workflow filter schema
 */
export const workflowFilterSchema = z.object({
  property: z.string().min(1, 'Propriedade é obrigatória'),
  operator: z.enum([
    'equals',
    'not_equals',
    'contains',
    'not_contains',
    'greater_than',
    'less_than',
    'is_known',
    'is_unknown',
    'is_member_of_list',
    'not_member_of_list',
  ]),
  value: z.any(),
});

/**
 * Workflow condition schema
 */
export const workflowConditionSchema = z.object({
  operator: z.enum(['AND', 'OR']),
  filters: z.array(workflowFilterSchema),
});

/**
 * Workflow schedule schema
 */
export const workflowScheduleSchema = z.object({
  frequency: z.enum(['daily', 'weekly', 'monthly']),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Formato de hora inválido (HH:mm)'),
  dayOfWeek: z.number().min(0).max(6).optional(),
  dayOfMonth: z.number().min(1).max(31).optional(),
});

/**
 * Workflow trigger schema
 */
export const workflowTriggerSchema = z.object({
  type: z.enum([
    'contact_created',
    'contact_property_change',
    'deal_stage_change',
    'form_submission',
    'email_event',
    'manual_enrollment',
    'scheduled',
  ]),
  conditions: workflowConditionSchema,
  schedule: workflowScheduleSchema.optional(),
});

/**
 * Delay config schema
 */
export const delayConfigSchema = z.object({
  delayType: z.enum(['duration', 'until_date', 'until_event']),
  duration: z
    .object({
      value: z.number().min(1),
      unit: z.enum(['minutes', 'hours', 'days', 'weeks']),
    })
    .optional(),
  untilDate: z.date().optional(),
  untilEvent: z.string().optional(),
});

/**
 * Email config schema
 */
export const emailConfigSchema = z.object({
  emailTemplateId: z.string().optional(),
  emailSubject: z.string().optional(),
  emailBody: z.string().optional(),
  fromName: z.string().optional(),
  replyTo: z.string().email().optional(),
});

/**
 * Task config schema
 */
export const taskConfigSchema = z.object({
  taskTitle: z.string().min(1, 'Título da tarefa é obrigatório'),
  taskDescription: z.string().optional(),
  taskType: z.string().optional(),
  assignToOwnerId: z.boolean().optional(),
  assignToUserId: z.string().optional(),
  taskDueIn: z
    .object({
      value: z.number().min(1),
      unit: z.enum(['days', 'weeks']),
    })
    .optional(),
});

/**
 * Update property config schema
 */
export const updatePropertyConfigSchema = z.object({
  propertyName: z.string().min(1, 'Nome da propriedade é obrigatório'),
  propertyValue: z.any(),
});

/**
 * Webhook config schema
 */
export const webhookConfigSchema = z.object({
  webhookUrl: z.string().url('URL inválida'),
  webhookMethod: z.enum(['GET', 'POST']),
  webhookHeaders: z.record(z.string()).optional(),
  webhookBody: z.string().optional(),
});

/**
 * List config schema
 */
export const listConfigSchema = z.object({
  listId: z.string().min(1, 'ID da lista é obrigatório'),
});

/**
 * Workflow step schema
 */
export const workflowStepSchema = z.object({
  id: z.string().optional(), // Auto-generated if not provided
  type: z.enum([
    'delay',
    'send_email',
    'send_whatsapp',
    'create_task',
    'update_property',
    'branch',
    'webhook',
    'add_to_list',
    'remove_from_list',
  ]),
  order: z.number().int().min(0),
  config: z.any(), // Will be validated based on type
  executionCount: z.number().int().min(0).optional(),
});

/**
 * Enrollment settings schema
 */
export const enrollmentSettingsSchema = z.object({
  allowReEnrollment: z.boolean(),
  reEnrollmentTrigger: z.enum(['property_change', 'time_based']).optional(),
  suppressForContacts: z.array(z.string()).optional(),
  goalCriteria: workflowConditionSchema.optional(),
});

/**
 * Create workflow schema
 */
export const createWorkflowSchema = z.object({
  name: z.string().min(1, 'Nome do workflow é obrigatório').max(255),
  description: z.string(),
  status: z.enum(['draft', 'active', 'paused', 'archived']).optional(),
  trigger: workflowTriggerSchema,
  steps: z.array(workflowStepSchema),
  enrollmentSettings: enrollmentSettingsSchema.optional(),
  createdBy: z.string().min(1, 'ID do criador é obrigatório'),
});

/**
 * Update workflow schema (all fields optional except restricted ones)
 */
export const updateWorkflowSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  status: z.enum(['draft', 'active', 'paused', 'archived']).optional(),
  trigger: workflowTriggerSchema.optional(),
  steps: z.array(workflowStepSchema).optional(),
  enrollmentSettings: enrollmentSettingsSchema.optional(),
});

/**
 * Type exports (inferred from schemas)
 */
export type CreateWorkflowInput = z.infer<typeof createWorkflowSchema>;
export type UpdateWorkflowInput = z.infer<typeof updateWorkflowSchema>;
export type WorkflowTrigger = z.infer<typeof workflowTriggerSchema>;
export type WorkflowStep = z.infer<typeof workflowStepSchema>;
export type WorkflowCondition = z.infer<typeof workflowConditionSchema>;
export type EnrollmentSettings = z.infer<typeof enrollmentSettingsSchema>;
