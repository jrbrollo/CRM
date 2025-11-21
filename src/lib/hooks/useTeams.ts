/**
 * Team Hooks
 *
 * React Query hooks for managing teams and planners.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTeams, getTeam, createTeam, updateTeam } from '../services/teamService';
import { toast } from 'sonner';

// Query Keys
export const teamKeys = {
  all: ['teams'] as const,
  lists: () => [...teamKeys.all, 'list'] as const,
  details: () => [...teamKeys.all, 'detail'] as const,
  detail: (id: string) => [...teamKeys.details(), id] as const,
};

/**
 * Hook to fetch all teams
 */
export function useTeams() {
  return useQuery({
    queryKey: teamKeys.lists(),
    queryFn: getTeams,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch a single team by ID
 */
export function useTeam(teamId: string) {
  return useQuery({
    queryKey: teamKeys.detail(teamId),
    queryFn: () => getTeam(teamId),
    staleTime: 5 * 60 * 1000,
    enabled: !!teamId,
  });
}

/**
 * Hook to create a new team
 */
export function useCreateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTeam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamKeys.lists() });
      toast.success('Time criado com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Error creating team:', error);
      toast.error(error.message || 'Erro ao criar time');
    },
  });
}

/**
 * Hook to update a team
 */
export function useUpdateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ teamId, updates }: { teamId: string; updates: any }) =>
      updateTeam(teamId, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: teamKeys.lists() });
      queryClient.invalidateQueries({ queryKey: teamKeys.detail(variables.teamId) });
      toast.success('Time atualizado com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Error updating team:', error);
      toast.error(error.message || 'Erro ao atualizar time');
    },
  });
}
