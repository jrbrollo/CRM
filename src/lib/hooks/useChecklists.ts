/**
 * Checklist Hooks
 *
 * React Query hooks for managing conditional checklists with required actions.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getChecklistsForEntity,
  getChecklist,
  createChecklist,
  updateChecklist,
  deleteChecklist,
  updateChecklistItem,
  completeChecklistItem,
  canProgressWithChecklist,
  getIncompleteRequiredItems,
  createChecklistFromTemplate,
  getChecklistTemplates,
  getChecklistTemplate,
  createChecklistTemplate,
  deleteChecklistTemplate,
} from '../services/checklistService';
import {
  Checklist,
  ChecklistTemplate,
  CreateChecklistInput,
  UpdateChecklistInput,
  UpdateChecklistItemInput,
  CreateChecklistTemplateInput,
} from '../types/checklist.types';
import { toast } from 'sonner';

// Query Keys
export const checklistKeys = {
  all: ['checklists'] as const,
  lists: () => [...checklistKeys.all, 'list'] as const,
  byEntity: (entityType: string, entityId: string) =>
    [...checklistKeys.lists(), entityType, entityId] as const,
  details: () => [...checklistKeys.all, 'detail'] as const,
  detail: (id: string) => [...checklistKeys.details(), id] as const,
  canProgress: (id: string) =>
    [...checklistKeys.all, 'canProgress', id] as const,
  incompleteRequired: (id: string) =>
    [...checklistKeys.all, 'incompleteRequired', id] as const,
  templates: () => [...checklistKeys.all, 'templates'] as const,
  templatesByCategory: (category?: string) =>
    [...checklistKeys.templates(), category] as const,
  template: (id: string) => [...checklistKeys.templates(), id] as const,
};

/**
 * Hook to fetch checklists for an entity
 */
export function useChecklistsForEntity(
  entityType: 'workflow' | 'deal' | 'contact',
  entityId: string
) {
  return useQuery({
    queryKey: checklistKeys.byEntity(entityType, entityId),
    queryFn: () => getChecklistsForEntity(entityType, entityId),
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: !!entityId,
  });
}

/**
 * Hook to fetch a single checklist
 */
export function useChecklist(checklistId: string) {
  return useQuery({
    queryKey: checklistKeys.detail(checklistId),
    queryFn: () => getChecklist(checklistId),
    staleTime: 1 * 60 * 1000, // 1 minute (frequent updates for progress)
    enabled: !!checklistId,
  });
}

/**
 * Hook to check if can progress with checklist
 */
export function useCanProgressWithChecklist(checklistId: string) {
  return useQuery({
    queryKey: checklistKeys.canProgress(checklistId),
    queryFn: () => canProgressWithChecklist(checklistId),
    staleTime: 1 * 60 * 1000,
    enabled: !!checklistId,
  });
}

/**
 * Hook to get incomplete required items
 */
export function useIncompleteRequiredItems(checklistId: string) {
  return useQuery({
    queryKey: checklistKeys.incompleteRequired(checklistId),
    queryFn: () => getIncompleteRequiredItems(checklistId),
    staleTime: 1 * 60 * 1000,
    enabled: !!checklistId,
  });
}

/**
 * Hook to create a checklist
 */
export function useCreateChecklist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateChecklistInput) => createChecklist(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: checklistKeys.byEntity(
          variables.entityType,
          variables.entityId
        ),
      });
      toast.success('Checklist criado com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Error creating checklist:', error);
      toast.error(error.message || 'Erro ao criar checklist');
    },
  });
}

/**
 * Hook to update a checklist
 */
export function useUpdateChecklist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      checklistId,
      data,
    }: {
      checklistId: string;
      data: UpdateChecklistInput;
    }) => updateChecklist(checklistId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: checklistKeys.detail(variables.checklistId),
      });
      queryClient.invalidateQueries({ queryKey: checklistKeys.lists() });
      toast.success('Checklist atualizado com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Error updating checklist:', error);
      toast.error(error.message || 'Erro ao atualizar checklist');
    },
  });
}

/**
 * Hook to delete a checklist
 */
export function useDeleteChecklist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (checklistId: string) => deleteChecklist(checklistId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: checklistKeys.lists() });
      toast.success('Checklist deletado com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Error deleting checklist:', error);
      toast.error(error.message || 'Erro ao deletar checklist');
    },
  });
}

/**
 * Hook to update a checklist item
 */
export function useUpdateChecklistItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      checklistId,
      itemId,
      updates,
      userId,
    }: {
      checklistId: string;
      itemId: string;
      updates: UpdateChecklistItemInput;
      userId?: string;
    }) => updateChecklistItem(checklistId, itemId, updates, userId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: checklistKeys.detail(variables.checklistId),
      });
      queryClient.invalidateQueries({
        queryKey: checklistKeys.canProgress(variables.checklistId),
      });
      queryClient.invalidateQueries({
        queryKey: checklistKeys.incompleteRequired(variables.checklistId),
      });
      toast.success('Item atualizado!');
    },
    onError: (error: Error) => {
      console.error('Error updating checklist item:', error);
      toast.error(error.message || 'Erro ao atualizar item');
    },
  });
}

/**
 * Hook to complete a checklist item
 */
export function useCompleteChecklistItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      checklistId,
      itemId,
      userId,
      answer,
    }: {
      checklistId: string;
      itemId: string;
      userId: string;
      answer?: any;
    }) => completeChecklistItem(checklistId, itemId, userId, answer),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: checklistKeys.detail(variables.checklistId),
      });
      queryClient.invalidateQueries({
        queryKey: checklistKeys.canProgress(variables.checklistId),
      });
      queryClient.invalidateQueries({
        queryKey: checklistKeys.incompleteRequired(variables.checklistId),
      });
      toast.success('✅ Item concluído!');
    },
    onError: (error: Error) => {
      console.error('Error completing checklist item:', error);
      toast.error(error.message || 'Erro ao concluir item');
    },
  });
}

/**
 * Hook to create checklist from template
 */
export function useCreateChecklistFromTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      templateId,
      entityType,
      entityId,
      createdBy,
    }: {
      templateId: string;
      entityType: 'workflow' | 'deal' | 'contact';
      entityId: string;
      createdBy: string;
    }) =>
      createChecklistFromTemplate(templateId, entityType, entityId, createdBy),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: checklistKeys.byEntity(
          variables.entityType,
          variables.entityId
        ),
      });
      toast.success('Checklist criado a partir do template!');
    },
    onError: (error: Error) => {
      console.error('Error creating checklist from template:', error);
      toast.error(error.message || 'Erro ao criar checklist do template');
    },
  });
}

// ==================== TEMPLATE HOOKS ====================

/**
 * Hook to fetch checklist templates
 */
export function useChecklistTemplates(category?: string) {
  return useQuery({
    queryKey: checklistKeys.templatesByCategory(category),
    queryFn: () => getChecklistTemplates(category),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to fetch a single template
 */
export function useChecklistTemplate(templateId: string) {
  return useQuery({
    queryKey: checklistKeys.template(templateId),
    queryFn: () => getChecklistTemplate(templateId),
    staleTime: 10 * 60 * 1000,
    enabled: !!templateId,
  });
}

/**
 * Hook to create a checklist template
 */
export function useCreateChecklistTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateChecklistTemplateInput) =>
      createChecklistTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: checklistKeys.templates() });
      toast.success('Template criado com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Error creating template:', error);
      toast.error(error.message || 'Erro ao criar template');
    },
  });
}

/**
 * Hook to delete a template
 */
export function useDeleteChecklistTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (templateId: string) => deleteChecklistTemplate(templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: checklistKeys.templates() });
      toast.success('Template deletado com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Error deleting template:', error);
      toast.error(error.message || 'Erro ao deletar template');
    },
  });
}
