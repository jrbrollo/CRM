/**
 * Deal Hooks
 *
 * React Query hooks for managing deals with caching and real-time updates.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DocumentSnapshot } from 'firebase/firestore';
import {
  getDeals,
  getDeal,
  getDealsByStage,
  createDeal,
  updateDeal,
  moveDealToStage,
  markDealAsWon,
  markDealAsLost,
  reopenDeal,
  deleteDeal,
  getDealValueByStatus,
  getWeightedPipelineValue,
  transferDealOwnership,
} from '../services/dealService';
import {
  Deal,
  DealFilters,
  CreateDealInput,
  UpdateDealInput,
} from '../types';
import { toast } from 'sonner';

// Query Keys
export const dealKeys = {
  all: ['deals'] as const,
  lists: () => [...dealKeys.all, 'list'] as const,
  list: (filters?: DealFilters) => [...dealKeys.lists(), filters] as const,
  byStage: (pipelineId: string, stageId: string) =>
    [...dealKeys.all, 'stage', pipelineId, stageId] as const,
  details: () => [...dealKeys.all, 'detail'] as const,
  detail: (id: string) => [...dealKeys.details(), id] as const,
  values: () => [...dealKeys.all, 'values'] as const,
  valueByStatus: (ownerId?: string) =>
    [...dealKeys.values(), 'byStatus', ownerId] as const,
  weightedValue: (pipelineId: string) =>
    [...dealKeys.values(), 'weighted', pipelineId] as const,
};

/**
 * Hook to fetch paginated deals with filters
 */
export function useDeals(
  filters?: DealFilters,
  pageLimit: number = 50,
  startAfterDoc?: DocumentSnapshot
) {
  return useQuery({
    queryKey: dealKeys.list(filters),
    queryFn: async () => {
      const result = await getDeals(filters, pageLimit, startAfterDoc);
      return result.deals;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to fetch a single deal by ID
 */
export function useDeal(dealId: string) {
  return useQuery({
    queryKey: dealKeys.detail(dealId),
    queryFn: () => getDeal(dealId),
    staleTime: 5 * 60 * 1000,
    enabled: !!dealId,
  });
}

/**
 * Hook to fetch deals by stage (for Kanban view)
 */
export function useDealsByStage(pipelineId: string, stageId: string) {
  return useQuery({
    queryKey: dealKeys.byStage(pipelineId, stageId),
    queryFn: () => getDealsByStage(pipelineId, stageId),
    staleTime: 2 * 60 * 1000, // 2 minutes (more frequent updates for Kanban)
    enabled: !!pipelineId && !!stageId,
  });
}

/**
 * Hook to get deal values by status
 */
export function useDealValueByStatus(ownerId?: string) {
  return useQuery({
    queryKey: dealKeys.valueByStatus(ownerId),
    queryFn: () => getDealValueByStatus(ownerId),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to get weighted pipeline value
 */
export function useWeightedPipelineValue(pipelineId: string) {
  return useQuery({
    queryKey: dealKeys.weightedValue(pipelineId),
    queryFn: () => getWeightedPipelineValue(pipelineId),
    staleTime: 5 * 60 * 1000,
    enabled: !!pipelineId,
  });
}

/**
 * Hook to create a new deal
 */
export function useCreateDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateDealInput) => createDeal(data),
    onSuccess: () => {
      // Invalidate all deal lists and values
      queryClient.invalidateQueries({ queryKey: dealKeys.lists() });
      queryClient.invalidateQueries({ queryKey: dealKeys.values() });
      toast.success('Negócio criado com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Error creating deal:', error);
      toast.error(error.message || 'Erro ao criar negócio');
    },
  });
}

/**
 * Hook to update a deal
 */
export function useUpdateDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      dealId,
      data,
    }: {
      dealId: string;
      data: UpdateDealInput;
    }) => updateDeal(dealId, data),
    onSuccess: (_, variables) => {
      // Invalidate specific deal and all lists
      queryClient.invalidateQueries({
        queryKey: dealKeys.detail(variables.dealId),
      });
      queryClient.invalidateQueries({ queryKey: dealKeys.lists() });
      queryClient.invalidateQueries({ queryKey: dealKeys.values() });
      toast.success('Negócio atualizado com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Error updating deal:', error);
      toast.error(error.message || 'Erro ao atualizar negócio');
    },
  });
}

/**
 * Hook to move deal to a different stage
 */
export function useMoveDealToStage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      dealId,
      newStageId,
      newProbability,
    }: {
      dealId: string;
      newStageId: string;
      newProbability?: number;
    }) => moveDealToStage(dealId, newStageId, newProbability),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: dealKeys.detail(variables.dealId),
      });
      queryClient.invalidateQueries({ queryKey: dealKeys.lists() });
      queryClient.invalidateQueries({ queryKey: dealKeys.values() });
      // Invalidate stage queries for Kanban updates
      queryClient.invalidateQueries({ queryKey: [...dealKeys.all, 'stage'] });
      toast.success('Negócio movido para novo estágio!');
    },
    onError: (error: Error) => {
      console.error('Error moving deal:', error);
      toast.error(error.message || 'Erro ao mover negócio');
    },
  });
}

/**
 * Hook to mark deal as won
 */
export function useMarkDealAsWon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dealId: string) => markDealAsWon(dealId),
    onSuccess: (_, dealId) => {
      queryClient.invalidateQueries({ queryKey: dealKeys.detail(dealId) });
      queryClient.invalidateQueries({ queryKey: dealKeys.lists() });
      queryClient.invalidateQueries({ queryKey: dealKeys.values() });
      toast.success('🎉 Negócio ganho!');
    },
    onError: (error: Error) => {
      console.error('Error marking deal as won:', error);
      toast.error(error.message || 'Erro ao marcar negócio como ganho');
    },
  });
}

/**
 * Hook to mark deal as lost
 */
export function useMarkDealAsLost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ dealId, reason }: { dealId: string; reason?: string }) =>
      markDealAsLost(dealId, reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: dealKeys.detail(variables.dealId),
      });
      queryClient.invalidateQueries({ queryKey: dealKeys.lists() });
      queryClient.invalidateQueries({ queryKey: dealKeys.values() });
      toast.success('Negócio marcado como perdido');
    },
    onError: (error: Error) => {
      console.error('Error marking deal as lost:', error);
      toast.error(error.message || 'Erro ao marcar negócio como perdido');
    },
  });
}

/**
 * Hook to reopen a deal
 */
export function useReopenDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dealId: string) => reopenDeal(dealId),
    onSuccess: (_, dealId) => {
      queryClient.invalidateQueries({ queryKey: dealKeys.detail(dealId) });
      queryClient.invalidateQueries({ queryKey: dealKeys.lists() });
      queryClient.invalidateQueries({ queryKey: dealKeys.values() });
      toast.success('Negócio reaberto!');
    },
    onError: (error: Error) => {
      console.error('Error reopening deal:', error);
      toast.error(error.message || 'Erro ao reabrir negócio');
    },
  });
}

/**
 * Hook to delete a deal
 */
export function useDeleteDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dealId: string) => deleteDeal(dealId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dealKeys.lists() });
      queryClient.invalidateQueries({ queryKey: dealKeys.values() });
      toast.success('Negócio deletado com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Error deleting deal:', error);
      toast.error(error.message || 'Erro ao deletar negócio');
    },
  });
}

/**
 * Hook to transfer deal ownership (passagem de bastão)
 */
export function useTransferDealOwnership() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      dealId,
      newOwnerId,
      reason,
    }: {
      dealId: string;
      newOwnerId: string;
      reason?: string;
    }) => transferDealOwnership(dealId, newOwnerId, reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: dealKeys.detail(variables.dealId),
      });
      queryClient.invalidateQueries({ queryKey: dealKeys.lists() });
      toast.success('Responsabilidade transferida com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Error transferring deal ownership:', error);
      toast.error(error.message || 'Erro ao transferir responsabilidade');
    },
  });
}

/**
 * Hook to get deal statistics
 */
export function useDealStats(ownerId?: string) {
  const filters: DealFilters = ownerId ? { ownerId } : {};

  return useQuery({
    queryKey: [...dealKeys.all, 'stats', ownerId],
    queryFn: async () => {
      const result = await getDeals(filters, 1000);
      const deals = result.deals;

      const totalValue = deals.reduce((sum, d) => sum + (d.value || 0), 0);
      const wonDeals = deals.filter(d => d.status === 'won');
      const lostDeals = deals.filter(d => d.status === 'lost');
      const openDeals = deals.filter(d => d.status === 'open');

      const stats = {
        total: deals.length,
        totalValue,
        byStatus: {
          open: openDeals.length,
          won: wonDeals.length,
          lost: lostDeals.length,
        },
        value: {
          open: openDeals.reduce((sum, d) => sum + (d.value || 0), 0),
          won: wonDeals.reduce((sum, d) => sum + (d.value || 0), 0),
          lost: lostDeals.reduce((sum, d) => sum + (d.value || 0), 0),
        },
        averageDealSize: totalValue / (deals.length || 1),
        winRate: ((wonDeals.length / (wonDeals.length + lostDeals.length || 1)) * 100),
        recent: {
          last7Days: deals.filter(d => {
            const created = new Date(d.createdAt);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return created >= weekAgo;
          }).length,
          last30Days: deals.filter(d => {
            const created = new Date(d.createdAt);
            const monthAgo = new Date();
            monthAgo.setDate(monthAgo.getDate() - 30);
            return created >= monthAgo;
          }).length,
        },
      };

      return stats;
    },
    staleTime: 5 * 60 * 1000,
  });
}
