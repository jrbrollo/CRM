/**
 * Workflow Hooks
 *
 * React Query hooks for managing workflows and enrollments.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getWorkflows,
  getWorkflow,
  getActiveWorkflows,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  activateWorkflow,
  pauseWorkflow,
  getContactEnrollments,
  getWorkflowEnrollments,
  manuallyEnrollContact,
  unenrollContactFromWorkflow,
} from '../services/workflowService';
import {
  Workflow,
  CreateWorkflowInput,
  UpdateWorkflowInput,
} from '../types';
import { toast } from 'sonner';

// Query Keys
export const workflowKeys = {
  all: ['workflows'] as const,
  lists: () => [...workflowKeys.all, 'list'] as const,
  list: (status?: string) => [...workflowKeys.lists(), status] as const,
  active: () => [...workflowKeys.all, 'active'] as const,
  details: () => [...workflowKeys.all, 'detail'] as const,
  detail: (id: string) => [...workflowKeys.details(), id] as const,
  enrollments: () => [...workflowKeys.all, 'enrollments'] as const,
  contactEnrollments: (contactId: string) =>
    [...workflowKeys.enrollments(), 'contact', contactId] as const,
  workflowEnrollments: (workflowId: string, status?: string) =>
    [...workflowKeys.enrollments(), 'workflow', workflowId, status] as const,
};

/**
 * Hook to fetch all workflows
 */
export function useWorkflows(status?: string) {
  return useQuery({
    queryKey: workflowKeys.list(status),
    queryFn: () => getWorkflows(status),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch active workflows
 */
export function useActiveWorkflows() {
  return useQuery({
    queryKey: workflowKeys.active(),
    queryFn: getActiveWorkflows,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch a single workflow
 */
export function useWorkflow(workflowId: string) {
  return useQuery({
    queryKey: workflowKeys.detail(workflowId),
    queryFn: () => getWorkflow(workflowId),
    staleTime: 5 * 60 * 1000,
    enabled: !!workflowId,
  });
}

/**
 * Hook to get contact enrollments
 */
export function useContactEnrollments(contactId: string) {
  return useQuery({
    queryKey: workflowKeys.contactEnrollments(contactId),
    queryFn: () => getContactEnrollments(contactId),
    staleTime: 2 * 60 * 1000,
    enabled: !!contactId,
  });
}

/**
 * Hook to get workflow enrollments
 */
export function useWorkflowEnrollments(workflowId: string, status?: string) {
  return useQuery({
    queryKey: workflowKeys.workflowEnrollments(workflowId, status),
    queryFn: () => getWorkflowEnrollments(workflowId, status),
    staleTime: 2 * 60 * 1000,
    enabled: !!workflowId,
  });
}

/**
 * Hook to create a workflow
 */
export function useCreateWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateWorkflowInput) => createWorkflow(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.lists() });
      toast.success('Workflow criado com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Error creating workflow:', error);
      toast.error(error.message || 'Erro ao criar workflow');
    },
  });
}

/**
 * Hook to update a workflow
 */
export function useUpdateWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      workflowId,
      data,
    }: {
      workflowId: string;
      data: UpdateWorkflowInput;
    }) => updateWorkflow(workflowId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: workflowKeys.detail(variables.workflowId),
      });
      queryClient.invalidateQueries({ queryKey: workflowKeys.lists() });
      toast.success('Workflow atualizado com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Error updating workflow:', error);
      toast.error(error.message || 'Erro ao atualizar workflow');
    },
  });
}

/**
 * Hook to delete a workflow
 */
export function useDeleteWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (workflowId: string) => deleteWorkflow(workflowId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.lists() });
      toast.success('Workflow deletado com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Error deleting workflow:', error);
      toast.error(error.message || 'Erro ao deletar workflow');
    },
  });
}

/**
 * Hook to activate a workflow
 */
export function useActivateWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (workflowId: string) => activateWorkflow(workflowId),
    onSuccess: (_, workflowId) => {
      queryClient.invalidateQueries({
        queryKey: workflowKeys.detail(workflowId),
      });
      queryClient.invalidateQueries({ queryKey: workflowKeys.lists() });
      queryClient.invalidateQueries({ queryKey: workflowKeys.active() });
      toast.success('Workflow ativado!');
    },
    onError: (error: Error) => {
      console.error('Error activating workflow:', error);
      toast.error(error.message || 'Erro ao ativar workflow');
    },
  });
}

/**
 * Hook to pause a workflow
 */
export function usePauseWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (workflowId: string) => pauseWorkflow(workflowId),
    onSuccess: (_, workflowId) => {
      queryClient.invalidateQueries({
        queryKey: workflowKeys.detail(workflowId),
      });
      queryClient.invalidateQueries({ queryKey: workflowKeys.lists() });
      queryClient.invalidateQueries({ queryKey: workflowKeys.active() });
      toast.success('Workflow pausado');
    },
    onError: (error: Error) => {
      console.error('Error pausing workflow:', error);
      toast.error(error.message || 'Erro ao pausar workflow');
    },
  });
}

/**
 * Hook to manually enroll a contact
 */
export function useManuallyEnrollContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      workflowId,
      contactId,
    }: {
      workflowId: string;
      contactId: string;
    }) => manuallyEnrollContact(workflowId, contactId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: workflowKeys.contactEnrollments(variables.contactId),
      });
      queryClient.invalidateQueries({
        queryKey: workflowKeys.workflowEnrollments(variables.workflowId),
      });
      queryClient.invalidateQueries({
        queryKey: workflowKeys.detail(variables.workflowId),
      });
      toast.success('Contato inscrito no workflow!');
    },
    onError: (error: Error) => {
      console.error('Error enrolling contact:', error);
      toast.error(error.message || 'Erro ao inscrever contato');
    },
  });
}

/**
 * Hook to unenroll a contact
 */
export function useUnenrollContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (enrollmentId: string) =>
      unenrollContactFromWorkflow(enrollmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.enrollments() });
      queryClient.invalidateQueries({ queryKey: workflowKeys.lists() });
      toast.success('Contato desinscrito do workflow');
    },
    onError: (error: Error) => {
      console.error('Error unenrolling contact:', error);
      toast.error(error.message || 'Erro ao desinscrever contato');
    },
  });
}
