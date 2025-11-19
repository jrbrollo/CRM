/**
 * Pipeline Hooks
 *
 * React Query hooks for managing sales pipelines and stages.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getPipelines,
  getPipeline,
  getDefaultPipeline,
  createPipeline,
  updatePipeline,
  deletePipeline,
  setAsDefault,
  addStage,
  updateStage,
  removeStage,
  reorderStages,
  createDefaultPipeline,
} from '../services/pipelineService';
import {
  Pipeline,
  CreatePipelineInput,
  UpdatePipelineInput,
} from '../types';
import { toast } from 'sonner';

// Query Keys
export const pipelineKeys = {
  all: ['pipelines'] as const,
  lists: () => [...pipelineKeys.all, 'list'] as const,
  details: () => [...pipelineKeys.all, 'detail'] as const,
  detail: (id: string) => [...pipelineKeys.details(), id] as const,
  default: () => [...pipelineKeys.all, 'default'] as const,
};

/**
 * Hook to fetch all pipelines
 */
export function usePipelines() {
  return useQuery({
    queryKey: pipelineKeys.lists(),
    queryFn: getPipelines,
    staleTime: 10 * 60 * 1000, // 10 minutes (pipelines don't change often)
  });
}

/**
 * Hook to fetch a single pipeline by ID
 */
export function usePipeline(pipelineId: string) {
  return useQuery({
    queryKey: pipelineKeys.detail(pipelineId),
    queryFn: () => getPipeline(pipelineId),
    staleTime: 10 * 60 * 1000,
    enabled: !!pipelineId,
  });
}

/**
 * Hook to fetch the default pipeline
 */
export function useDefaultPipeline() {
  return useQuery({
    queryKey: pipelineKeys.default(),
    queryFn: getDefaultPipeline,
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Hook to create a new pipeline
 */
export function useCreatePipeline() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePipelineInput) => createPipeline(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pipelineKeys.lists() });
      queryClient.invalidateQueries({ queryKey: pipelineKeys.default() });
      toast.success('Pipeline criado com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Error creating pipeline:', error);
      toast.error(error.message || 'Erro ao criar pipeline');
    },
  });
}

/**
 * Hook to create the default pipeline
 */
export function useCreateDefaultPipeline() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createDefaultPipeline,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pipelineKeys.lists() });
      queryClient.invalidateQueries({ queryKey: pipelineKeys.default() });
      toast.success('Pipeline padrão criado com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Error creating default pipeline:', error);
      toast.error(error.message || 'Erro ao criar pipeline padrão');
    },
  });
}

/**
 * Hook to update a pipeline
 */
export function useUpdatePipeline() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      pipelineId,
      data,
    }: {
      pipelineId: string;
      data: UpdatePipelineInput;
    }) => updatePipeline(pipelineId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: pipelineKeys.detail(variables.pipelineId),
      });
      queryClient.invalidateQueries({ queryKey: pipelineKeys.lists() });
      toast.success('Pipeline atualizado com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Error updating pipeline:', error);
      toast.error(error.message || 'Erro ao atualizar pipeline');
    },
  });
}

/**
 * Hook to delete a pipeline
 */
export function useDeletePipeline() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (pipelineId: string) => deletePipeline(pipelineId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pipelineKeys.lists() });
      toast.success('Pipeline deletado com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Error deleting pipeline:', error);
      toast.error(error.message || 'Erro ao deletar pipeline');
    },
  });
}

/**
 * Hook to set a pipeline as default
 */
export function useSetAsDefaultPipeline() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (pipelineId: string) => setAsDefault(pipelineId),
    onSuccess: (_, pipelineId) => {
      queryClient.invalidateQueries({
        queryKey: pipelineKeys.detail(pipelineId),
      });
      queryClient.invalidateQueries({ queryKey: pipelineKeys.lists() });
      queryClient.invalidateQueries({ queryKey: pipelineKeys.default() });
      toast.success('Pipeline definido como padrão!');
    },
    onError: (error: Error) => {
      console.error('Error setting as default:', error);
      toast.error(error.message || 'Erro ao definir pipeline como padrão');
    },
  });
}

/**
 * Hook to add a stage to a pipeline
 */
export function useAddStage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      pipelineId,
      stageName,
      probability,
      rottenDays,
    }: {
      pipelineId: string;
      stageName: string;
      probability: number;
      rottenDays?: number;
    }) => addStage(pipelineId, stageName, probability, rottenDays),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: pipelineKeys.detail(variables.pipelineId),
      });
      queryClient.invalidateQueries({ queryKey: pipelineKeys.lists() });
      toast.success('Estágio adicionado!');
    },
    onError: (error: Error) => {
      console.error('Error adding stage:', error);
      toast.error(error.message || 'Erro ao adicionar estágio');
    },
  });
}

/**
 * Hook to update a stage
 */
export function useUpdateStage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      pipelineId,
      stageId,
      updates,
    }: {
      pipelineId: string;
      stageId: string;
      updates: {
        name?: string;
        probability?: number;
        rottenDays?: number;
      };
    }) => updateStage(pipelineId, stageId, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: pipelineKeys.detail(variables.pipelineId),
      });
      queryClient.invalidateQueries({ queryKey: pipelineKeys.lists() });
      toast.success('Estágio atualizado!');
    },
    onError: (error: Error) => {
      console.error('Error updating stage:', error);
      toast.error(error.message || 'Erro ao atualizar estágio');
    },
  });
}

/**
 * Hook to remove a stage
 */
export function useRemoveStage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      pipelineId,
      stageId,
    }: {
      pipelineId: string;
      stageId: string;
    }) => removeStage(pipelineId, stageId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: pipelineKeys.detail(variables.pipelineId),
      });
      queryClient.invalidateQueries({ queryKey: pipelineKeys.lists() });
      toast.success('Estágio removido!');
    },
    onError: (error: Error) => {
      console.error('Error removing stage:', error);
      toast.error(error.message || 'Erro ao remover estágio');
    },
  });
}

/**
 * Hook to reorder stages
 */
export function useReorderStages() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      pipelineId,
      stageIds,
    }: {
      pipelineId: string;
      stageIds: string[];
    }) => reorderStages(pipelineId, stageIds),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: pipelineKeys.detail(variables.pipelineId),
      });
      queryClient.invalidateQueries({ queryKey: pipelineKeys.lists() });
      toast.success('Estágios reordenados!');
    },
    onError: (error: Error) => {
      console.error('Error reordering stages:', error);
      toast.error(error.message || 'Erro ao reordenar estágios');
    },
  });
}
