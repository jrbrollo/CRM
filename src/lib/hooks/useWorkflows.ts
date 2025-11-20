/**
 * Workflow Hooks
 *
 * React Query hooks for workflow management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  createWorkflow,
  createWorkflows,
  getWorkflow,
  getWorkflows,
  getActiveWorkflows,
  getWorkflowsByCategory,
  updateWorkflow,
  toggleWorkflowActive,
  deleteWorkflow,
  deleteAllWorkflows,
} from '../services/workflowService';
import type {
  CreateWorkflowInput,
  UpdateWorkflowInput,
  Workflow,
} from '../types/workflow.types';

/**
 * Get all workflows
 */
export function useWorkflows() {
  return useQuery({
    queryKey: ['workflows'],
    queryFn: getWorkflows,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Get active workflows
 */
export function useActiveWorkflows() {
  return useQuery({
    queryKey: ['workflows', 'active'],
    queryFn: getActiveWorkflows,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Get workflows by category
 */
export function useWorkflowsByCategory(category: Workflow['category']) {
  return useQuery({
    queryKey: ['workflows', 'category', category],
    queryFn: () => getWorkflowsByCategory(category),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Get single workflow
 */
export function useWorkflow(workflowId: string) {
  return useQuery({
    queryKey: ['workflows', workflowId],
    queryFn: () => getWorkflow(workflowId),
    enabled: !!workflowId,
  });
}

/**
 * Create workflow
 */
export function useCreateWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateWorkflowInput) => createWorkflow(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast.success('Workflow criado com sucesso!');
    },
    onError: (error) => {
      console.error('Error creating workflow:', error);
      toast.error('Erro ao criar workflow');
    },
  });
}

/**
 * Create multiple workflows
 */
export function useCreateWorkflows() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (inputs: CreateWorkflowInput[]) => createWorkflows(inputs),
    onSuccess: (ids) => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast.success(`${ids.length} workflows criados com sucesso!`);
    },
    onError: (error) => {
      console.error('Error creating workflows:', error);
      toast.error('Erro ao criar workflows');
    },
  });
}

/**
 * Update workflow
 */
export function useUpdateWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      workflowId,
      updates,
    }: {
      workflowId: string;
      updates: UpdateWorkflowInput;
    }) => updateWorkflow(workflowId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast.success('Workflow atualizado!');
    },
    onError: (error) => {
      console.error('Error updating workflow:', error);
      toast.error('Erro ao atualizar workflow');
    },
  });
}

/**
 * Toggle workflow active status
 */
export function useToggleWorkflowActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workflowId, isActive }: { workflowId: string; isActive: boolean }) =>
      toggleWorkflowActive(workflowId, isActive),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast.success(
        variables.isActive
          ? 'Workflow ativado!'
          : 'Workflow desativado!'
      );
    },
    onError: (error) => {
      console.error('Error toggling workflow:', error);
      toast.error('Erro ao alterar status do workflow');
    },
  });
}

/**
 * Delete workflow
 */
export function useDeleteWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (workflowId: string) => deleteWorkflow(workflowId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast.success('Workflow deletado!');
    },
    onError: (error) => {
      console.error('Error deleting workflow:', error);
      toast.error('Erro ao deletar workflow');
    },
  });
}

/**
 * Delete all workflows (for reset)
 */
export function useDeleteAllWorkflows() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAllWorkflows,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast.success('Todos os workflows foram deletados!');
    },
    onError: (error) => {
      console.error('Error deleting all workflows:', error);
      toast.error('Erro ao deletar workflows');
    },
  });
}
