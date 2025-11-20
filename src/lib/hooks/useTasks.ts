/**
 * Task Hooks
 *
 * React Query hooks for task management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  createTask,
  getTask,
  getTasksByAssignee,
  getTasksByDeal,
  getTasksByStatus,
  getOverdueTasks,
  getTodayTasks,
  updateTask,
  completeTask,
  markTaskOverdue,
  cancelTask,
  deleteTask,
} from '../services/taskService';
import type { CreateTaskInput, UpdateTaskInput, TaskStatus } from '../types/task.types';

/**
 * Get tasks for a user
 */
export function useTasks(userId: string) {
  return useQuery({
    queryKey: ['tasks', userId],
    queryFn: () => getTasksByAssignee(userId),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Get single task
 */
export function useTask(taskId: string) {
  return useQuery({
    queryKey: ['tasks', taskId],
    queryFn: () => getTask(taskId),
    enabled: !!taskId,
  });
}

/**
 * Get tasks for a deal
 */
export function useDealTasks(dealId: string) {
  return useQuery({
    queryKey: ['tasks', 'deal', dealId],
    queryFn: () => getTasksByDeal(dealId),
    enabled: !!dealId,
  });
}

/**
 * Get tasks by status
 */
export function useTasksByStatus(userId: string, status: TaskStatus) {
  return useQuery({
    queryKey: ['tasks', userId, 'status', status],
    queryFn: () => getTasksByStatus(userId, status),
  });
}

/**
 * Get overdue tasks
 */
export function useOverdueTasks(userId?: string) {
  return useQuery({
    queryKey: ['tasks', 'overdue', userId || 'all'],
    queryFn: () => getOverdueTasks(userId),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Get today's tasks
 */
export function useTodayTasks(userId: string) {
  return useQuery({
    queryKey: ['tasks', 'today', userId],
    queryFn: () => getTodayTasks(userId),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Create task
 */
export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTaskInput) => createTask(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      if (variables.dealId) {
        queryClient.invalidateQueries({
          queryKey: ['tasks', 'deal', variables.dealId],
        });
      }
      toast.success('Tarefa criada com sucesso!');
    },
    onError: (error) => {
      console.error('Error creating task:', error);
      toast.error('Erro ao criar tarefa');
    },
  });
}

/**
 * Update task
 */
export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, updates }: { taskId: string; updates: UpdateTaskInput }) =>
      updateTask(taskId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Tarefa atualizada!');
    },
    onError: (error) => {
      console.error('Error updating task:', error);
      toast.error('Erro ao atualizar tarefa');
    },
  });
}

/**
 * Complete task
 */
export function useCompleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, outcome }: { taskId: string; outcome?: string }) =>
      completeTask(taskId, outcome),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Tarefa concluída!');
    },
    onError: (error) => {
      console.error('Error completing task:', error);
      toast.error('Erro ao concluir tarefa');
    },
  });
}

/**
 * Mark task as overdue
 */
export function useMarkTaskOverdue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => markTaskOverdue(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (error) => {
      console.error('Error marking task overdue:', error);
    },
  });
}

/**
 * Cancel task
 */
export function useCancelTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => cancelTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Tarefa cancelada');
    },
    onError: (error) => {
      console.error('Error cancelling task:', error);
      toast.error('Erro ao cancelar tarefa');
    },
  });
}

/**
 * Delete task
 */
export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => deleteTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Tarefa deletada');
    },
    onError: (error) => {
      console.error('Error deleting task:', error);
      toast.error('Erro ao deletar tarefa');
    },
  });
}
