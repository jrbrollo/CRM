/**
 * Activity Hooks
 *
 * React Query hooks for managing activities (notes, emails, calls, tasks, etc).
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DocumentSnapshot } from 'firebase/firestore';
import {
  getActivities,
  getActivity,
  getContactTimeline,
  getPendingTasks,
  getTasksDueToday,
  getOverdueTasksCount,
  createActivity,
  updateActivity,
  completeTask,
  cancelTask,
  deleteActivity,
  createNote,
  logEmail,
  logCall,
  scheduleMeeting,
  createTask,
} from '../services/activityService';
import {
  Activity,
  ActivityFilters,
  CreateActivityInput,
  UpdateActivityInput,
} from '../types';
import { toast } from 'sonner';

// Query Keys
export const activityKeys = {
  all: ['activities'] as const,
  lists: () => [...activityKeys.all, 'list'] as const,
  list: (filters?: ActivityFilters) =>
    [...activityKeys.lists(), filters] as const,
  details: () => [...activityKeys.all, 'detail'] as const,
  detail: (id: string) => [...activityKeys.details(), id] as const,
  timeline: (contactId: string) =>
    [...activityKeys.all, 'timeline', contactId] as const,
  pendingTasks: (ownerId: string, overdueOnly?: boolean) =>
    [...activityKeys.all, 'pending', ownerId, overdueOnly] as const,
  tasksDueToday: (ownerId: string) =>
    [...activityKeys.all, 'dueToday', ownerId] as const,
  overdueCount: (ownerId: string) =>
    [...activityKeys.all, 'overdueCount', ownerId] as const,
};

/**
 * Hook to fetch paginated activities with filters
 */
export function useActivities(
  filters?: ActivityFilters,
  pageLimit: number = 50,
  startAfterDoc?: DocumentSnapshot
) {
  return useQuery({
    queryKey: activityKeys.list(filters),
    queryFn: async () => {
      const result = await getActivities(filters, pageLimit, startAfterDoc);
      return result.activities;
    },
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
}

/**
 * Hook to fetch a single activity by ID
 */
export function useActivity(activityId: string) {
  return useQuery({
    queryKey: activityKeys.detail(activityId),
    queryFn: () => getActivity(activityId),
    staleTime: 5 * 60 * 1000,
    enabled: !!activityId,
  });
}

/**
 * Hook to fetch contact timeline
 */
export function useContactTimeline(contactId: string, pageLimit: number = 50) {
  return useQuery({
    queryKey: activityKeys.timeline(contactId),
    queryFn: () => getContactTimeline(contactId, pageLimit),
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: !!contactId,
  });
}

/**
 * Hook to fetch pending tasks for a user
 */
export function usePendingTasks(ownerId: string, overdueOnly: boolean = false) {
  return useQuery({
    queryKey: activityKeys.pendingTasks(ownerId, overdueOnly),
    queryFn: () => getPendingTasks(ownerId, overdueOnly),
    staleTime: 1 * 60 * 1000, // 1 minute (more frequent for tasks)
    enabled: !!ownerId,
  });
}

/**
 * Hook to fetch tasks due today
 */
export function useTasksDueToday(ownerId: string) {
  return useQuery({
    queryKey: activityKeys.tasksDueToday(ownerId),
    queryFn: () => getTasksDueToday(ownerId),
    staleTime: 1 * 60 * 1000, // 1 minute
    enabled: !!ownerId,
  });
}

/**
 * Hook to get overdue tasks count
 */
export function useOverdueTasksCount(ownerId: string) {
  return useQuery({
    queryKey: activityKeys.overdueCount(ownerId),
    queryFn: () => getOverdueTasksCount(ownerId),
    staleTime: 2 * 60 * 1000,
    enabled: !!ownerId,
  });
}

/**
 * Hook to create a generic activity
 */
export function useCreateActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateActivityInput) => createActivity(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: activityKeys.lists() });
      queryClient.invalidateQueries({ queryKey: [...activityKeys.all, 'timeline'] });
      queryClient.invalidateQueries({ queryKey: [...activityKeys.all, 'pending'] });
      toast.success('Atividade criada com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Error creating activity:', error);
      toast.error(error.message || 'Erro ao criar atividade');
    },
  });
}

/**
 * Hook to update an activity
 */
export function useUpdateActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      activityId,
      data,
    }: {
      activityId: string;
      data: UpdateActivityInput;
    }) => updateActivity(activityId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: activityKeys.detail(variables.activityId),
      });
      queryClient.invalidateQueries({ queryKey: activityKeys.lists() });
      toast.success('Atividade atualizada com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Error updating activity:', error);
      toast.error(error.message || 'Erro ao atualizar atividade');
    },
  });
}

/**
 * Hook to complete a task
 */
export function useCompleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (activityId: string) => completeTask(activityId),
    onSuccess: (_, activityId) => {
      queryClient.invalidateQueries({
        queryKey: activityKeys.detail(activityId),
      });
      queryClient.invalidateQueries({ queryKey: activityKeys.lists() });
      queryClient.invalidateQueries({ queryKey: [...activityKeys.all, 'pending'] });
      queryClient.invalidateQueries({ queryKey: [...activityKeys.all, 'overdueCount'] });
      toast.success('✅ Tarefa concluída!');
    },
    onError: (error: Error) => {
      console.error('Error completing task:', error);
      toast.error(error.message || 'Erro ao concluir tarefa');
    },
  });
}

/**
 * Hook to cancel a task
 */
export function useCancelTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (activityId: string) => cancelTask(activityId),
    onSuccess: (_, activityId) => {
      queryClient.invalidateQueries({
        queryKey: activityKeys.detail(activityId),
      });
      queryClient.invalidateQueries({ queryKey: activityKeys.lists() });
      queryClient.invalidateQueries({ queryKey: [...activityKeys.all, 'pending'] });
      toast.success('Tarefa cancelada');
    },
    onError: (error: Error) => {
      console.error('Error cancelling task:', error);
      toast.error(error.message || 'Erro ao cancelar tarefa');
    },
  });
}

/**
 * Hook to delete an activity
 */
export function useDeleteActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (activityId: string) => deleteActivity(activityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: activityKeys.lists() });
      toast.success('Atividade deletada com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Error deleting activity:', error);
      toast.error(error.message || 'Erro ao deletar atividade');
    },
  });
}

/**
 * Hook to create a note
 */
export function useCreateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      ownerId,
      description,
      contactId,
      dealId,
    }: {
      ownerId: string;
      description: string;
      contactId?: string;
      dealId?: string;
    }) => createNote(ownerId, description, contactId, dealId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: activityKeys.lists() });
      queryClient.invalidateQueries({ queryKey: [...activityKeys.all, 'timeline'] });
      toast.success('Nota adicionada!');
    },
    onError: (error: Error) => {
      console.error('Error creating note:', error);
      toast.error(error.message || 'Erro ao criar nota');
    },
  });
}

/**
 * Hook to log an email
 */
export function useLogEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      ownerId,
      subject,
      description,
      contactId,
      dealId,
    }: {
      ownerId: string;
      subject: string;
      description: string;
      contactId?: string;
      dealId?: string;
    }) => logEmail(ownerId, subject, description, contactId, dealId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: activityKeys.lists() });
      queryClient.invalidateQueries({ queryKey: [...activityKeys.all, 'timeline'] });
      toast.success('Email registrado!');
    },
    onError: (error: Error) => {
      console.error('Error logging email:', error);
      toast.error(error.message || 'Erro ao registrar email');
    },
  });
}

/**
 * Hook to log a call
 */
export function useLogCall() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      ownerId,
      description,
      contactId,
      dealId,
    }: {
      ownerId: string;
      description: string;
      contactId?: string;
      dealId?: string;
    }) => logCall(ownerId, description, contactId, dealId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: activityKeys.lists() });
      queryClient.invalidateQueries({ queryKey: [...activityKeys.all, 'timeline'] });
      toast.success('Ligação registrada!');
    },
    onError: (error: Error) => {
      console.error('Error logging call:', error);
      toast.error(error.message || 'Erro ao registrar ligação');
    },
  });
}

/**
 * Hook to schedule a meeting
 */
export function useScheduleMeeting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      ownerId,
      subject,
      description,
      dueDate,
      contactId,
      dealId,
    }: {
      ownerId: string;
      subject: string;
      description: string;
      dueDate: Date;
      contactId?: string;
      dealId?: string;
    }) => scheduleMeeting(ownerId, subject, description, dueDate, contactId, dealId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: activityKeys.lists() });
      queryClient.invalidateQueries({ queryKey: [...activityKeys.all, 'pending'] });
      toast.success('Reunião agendada!');
    },
    onError: (error: Error) => {
      console.error('Error scheduling meeting:', error);
      toast.error(error.message || 'Erro ao agendar reunião');
    },
  });
}

/**
 * Hook to create a task
 */
export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      ownerId,
      subject,
      description,
      dueDate,
      contactId,
      dealId,
    }: {
      ownerId: string;
      subject: string;
      description: string;
      dueDate: Date;
      contactId?: string;
      dealId?: string;
    }) => createTask(ownerId, subject, description, dueDate, contactId, dealId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: activityKeys.lists() });
      queryClient.invalidateQueries({ queryKey: [...activityKeys.all, 'pending'] });
      toast.success('Tarefa criada!');
    },
    onError: (error: Error) => {
      console.error('Error creating task:', error);
      toast.error(error.message || 'Erro ao criar tarefa');
    },
  });
}

/**
 * Hook to get activity statistics
 */
export function useActivityStats(ownerId?: string) {
  const filters: ActivityFilters = ownerId ? { ownerId } : {};

  return useQuery({
    queryKey: [...activityKeys.all, 'stats', ownerId],
    queryFn: async () => {
      const activities = await getActivities(filters, 1000);

      const stats = {
        total: activities.length,
        byType: {
          note: activities.filter(a => a.type === 'note').length,
          email: activities.filter(a => a.type === 'email').length,
          call: activities.filter(a => a.type === 'call').length,
          meeting: activities.filter(a => a.type === 'meeting').length,
          task: activities.filter(a => a.type === 'task').length,
        },
        tasks: {
          total: activities.filter(a => a.type === 'task').length,
          completed: activities.filter(a => a.type === 'task' && a.completed).length,
          pending: activities.filter(a => a.type === 'task' && !a.completed && !a.cancelled).length,
          overdue: activities.filter(a =>
            a.type === 'task' &&
            !a.completed &&
            !a.cancelled &&
            a.dueDate &&
            new Date(a.dueDate) < new Date()
          ).length,
        },
      };

      return stats;
    },
    staleTime: 5 * 60 * 1000,
  });
}
