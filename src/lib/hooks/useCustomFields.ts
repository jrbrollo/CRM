/**
 * Custom Fields Hooks
 *
 * React Query hooks for managing sources and campaigns
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getSources,
  getSource,
  createSource,
  updateSource,
  deleteSource,
  getCampaigns,
  getCampaign,
  createCampaign,
  updateCampaign,
  deleteCampaign,
} from '../services/customFieldsService';
import type { CreateSourceInput, CreateCampaignInput } from '../types/customFields.types';
import { toast } from 'sonner';

// Query Keys
export const customFieldsKeys = {
  sources: ['sources'] as const,
  sourceDetail: (id: string) => ['sources', id] as const,
  campaigns: ['campaigns'] as const,
  campaignDetail: (id: string) => ['campaigns', id] as const,
};

// ============ SOURCES HOOKS ============

export function useSources() {
  return useQuery({
    queryKey: customFieldsKeys.sources,
    queryFn: getSources,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useSource(sourceId: string) {
  return useQuery({
    queryKey: customFieldsKeys.sourceDetail(sourceId),
    queryFn: () => getSource(sourceId),
    enabled: !!sourceId,
    staleTime: 10 * 60 * 1000,
  });
}

export function useCreateSource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSourceInput) => createSource(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customFieldsKeys.sources });
      toast.success('Fonte criada com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Error creating source:', error);
      toast.error(error.message || 'Erro ao criar fonte');
    },
  });
}

export function useUpdateSource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sourceId,
      data,
    }: {
      sourceId: string;
      data: Partial<CreateSourceInput>;
    }) => updateSource(sourceId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: customFieldsKeys.sourceDetail(variables.sourceId),
      });
      queryClient.invalidateQueries({ queryKey: customFieldsKeys.sources });
      toast.success('Fonte atualizada com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Error updating source:', error);
      toast.error(error.message || 'Erro ao atualizar fonte');
    },
  });
}

export function useDeleteSource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sourceId: string) => deleteSource(sourceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customFieldsKeys.sources });
      toast.success('Fonte removida com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Error deleting source:', error);
      toast.error(error.message || 'Erro ao remover fonte');
    },
  });
}

// ============ CAMPAIGNS HOOKS ============

export function useCampaigns() {
  return useQuery({
    queryKey: customFieldsKeys.campaigns,
    queryFn: getCampaigns,
    staleTime: 10 * 60 * 1000,
  });
}

export function useCampaign(campaignId: string) {
  return useQuery({
    queryKey: customFieldsKeys.campaignDetail(campaignId),
    queryFn: () => getCampaign(campaignId),
    enabled: !!campaignId,
    staleTime: 10 * 60 * 1000,
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCampaignInput) => createCampaign(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customFieldsKeys.campaigns });
      toast.success('Campanha criada com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Error creating campaign:', error);
      toast.error(error.message || 'Erro ao criar campanha');
    },
  });
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      campaignId,
      data,
    }: {
      campaignId: string;
      data: Partial<CreateCampaignInput>;
    }) => updateCampaign(campaignId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: customFieldsKeys.campaignDetail(variables.campaignId),
      });
      queryClient.invalidateQueries({ queryKey: customFieldsKeys.campaigns });
      toast.success('Campanha atualizada com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Error updating campaign:', error);
      toast.error(error.message || 'Erro ao atualizar campanha');
    },
  });
}

export function useDeleteCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (campaignId: string) => deleteCampaign(campaignId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customFieldsKeys.campaigns });
      toast.success('Campanha removida com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Error deleting campaign:', error);
      toast.error(error.message || 'Erro ao remover campanha');
    },
  });
}
