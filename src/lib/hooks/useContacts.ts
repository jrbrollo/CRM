/**
 * Contact Hooks
 *
 * React Query hooks for managing contacts with caching and real-time updates.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DocumentSnapshot } from 'firebase/firestore';
import {
  getContacts,
  getContact,
  searchContacts,
  createContact,
  updateContact,
  deleteContact,
  addTagToContact,
  removeTagFromContact,
  updateLeadScore,
  markContactAsContacted,
  enrollInWorkflow,
  unenrollFromWorkflow,
} from '../services/contactService';
import {
  Contact,
  ContactFilters,
  CreateContactInput,
  UpdateContactInput,
} from '../types';
import { toast } from 'sonner';

// Query Keys
export const contactKeys = {
  all: ['contacts'] as const,
  lists: () => [...contactKeys.all, 'list'] as const,
  list: (filters?: ContactFilters) =>
    [...contactKeys.lists(), filters] as const,
  details: () => [...contactKeys.all, 'detail'] as const,
  detail: (id: string) => [...contactKeys.details(), id] as const,
  search: (query: string) => [...contactKeys.all, 'search', query] as const,
};

/**
 * Hook to fetch paginated contacts with filters
 */
export function useContacts(
  filters?: ContactFilters,
  pageLimit: number = 50,
  startAfterDoc?: DocumentSnapshot
) {
  return useQuery({
    queryKey: contactKeys.list(filters),
    queryFn: async () => {
      const result = await getContacts(filters, pageLimit, startAfterDoc);
      return result.contacts;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });
}

/**
 * Hook to fetch a single contact by ID
 */
export function useContact(contactId: string) {
  return useQuery({
    queryKey: contactKeys.detail(contactId),
    queryFn: () => getContact(contactId),
    staleTime: 5 * 60 * 1000,
    enabled: !!contactId,
  });
}

/**
 * Hook to search contacts
 */
export function useSearchContacts(searchQuery: string, enabled: boolean = true) {
  return useQuery({
    queryKey: contactKeys.search(searchQuery),
    queryFn: () => searchContacts(searchQuery),
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: enabled && searchQuery.length >= 2,
  });
}

/**
 * Hook to create a new contact
 */
export function useCreateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateContactInput) => createContact(data),
    onSuccess: () => {
      // Invalidate all contact lists
      queryClient.invalidateQueries({ queryKey: contactKeys.lists() });
      toast.success('Contato criado com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Error creating contact:', error);
      toast.error(error.message || 'Erro ao criar contato');
    },
  });
}

/**
 * Hook to update a contact
 */
export function useUpdateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      contactId,
      data,
    }: {
      contactId: string;
      data: UpdateContactInput;
    }) => updateContact(contactId, data),
    onSuccess: (_, variables) => {
      // Invalidate specific contact and all lists
      queryClient.invalidateQueries({
        queryKey: contactKeys.detail(variables.contactId),
      });
      queryClient.invalidateQueries({ queryKey: contactKeys.lists() });
      toast.success('Contato atualizado com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Error updating contact:', error);
      toast.error(error.message || 'Erro ao atualizar contato');
    },
  });
}

/**
 * Hook to delete a contact
 */
export function useDeleteContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (contactId: string) => deleteContact(contactId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactKeys.lists() });
      toast.success('Contato deletado com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Error deleting contact:', error);
      toast.error(error.message || 'Erro ao deletar contato');
    },
  });
}

/**
 * Hook to mark contact as contacted
 */
export function useMarkContactAsContacted() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (contactId: string) => markContactAsContacted(contactId),
    onSuccess: (_, contactId) => {
      queryClient.invalidateQueries({
        queryKey: contactKeys.detail(contactId),
      });
      toast.success('Data de contato atualizada!');
    },
    onError: (error: Error) => {
      console.error('Error marking contact as contacted:', error);
      toast.error(error.message || 'Erro ao atualizar data de contato');
    },
  });
}

/**
 * Hook to add tag to contact
 */
export function useAddTagToContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ contactId, tag }: { contactId: string; tag: string }) =>
      addTagToContact(contactId, tag),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: contactKeys.detail(variables.contactId),
      });
      toast.success('Tag adicionada!');
    },
    onError: (error: Error) => {
      console.error('Error adding tag:', error);
      toast.error(error.message || 'Erro ao adicionar tag');
    },
  });
}

/**
 * Hook to remove tag from contact
 */
export function useRemoveTagFromContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ contactId, tag }: { contactId: string; tag: string }) =>
      removeTagFromContact(contactId, tag),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: contactKeys.detail(variables.contactId),
      });
      toast.success('Tag removida!');
    },
    onError: (error: Error) => {
      console.error('Error removing tag:', error);
      toast.error(error.message || 'Erro ao remover tag');
    },
  });
}

/**
 * Hook to update lead score
 */
export function useUpdateLeadScore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ contactId, score }: { contactId: string; score: number }) =>
      updateLeadScore(contactId, score),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: contactKeys.detail(variables.contactId),
      });
      toast.success('Lead score atualizado!');
    },
    onError: (error: Error) => {
      console.error('Error updating lead score:', error);
      toast.error(error.message || 'Erro ao atualizar lead score');
    },
  });
}

/**
 * Hook to enroll contact in workflow
 */
export function useEnrollInWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      contactId,
      workflowId,
    }: {
      contactId: string;
      workflowId: string;
    }) => enrollInWorkflow(contactId, workflowId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: contactKeys.detail(variables.contactId),
      });
      toast.success('Contato inscrito no workflow!');
    },
    onError: (error: Error) => {
      console.error('Error enrolling in workflow:', error);
      toast.error(error.message || 'Erro ao inscrever no workflow');
    },
  });
}

/**
 * Hook to unenroll contact from workflow
 */
export function useUnenrollFromWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      contactId,
      workflowId,
    }: {
      contactId: string;
      workflowId: string;
    }) => unenrollFromWorkflow(contactId, workflowId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: contactKeys.detail(variables.contactId),
      });
      toast.success('Contato desinscrito do workflow!');
    },
    onError: (error: Error) => {
      console.error('Error unenrolling from workflow:', error);
      toast.error(error.message || 'Erro ao desinscrever do workflow');
    },
  });
}

/**
 * Hook to get contact statistics
 */
export function useContactStats(ownerId?: string) {
  const filters: ContactFilters = ownerId ? { ownerId } : {};

  return useQuery({
    queryKey: [...contactKeys.all, 'stats', ownerId],
    queryFn: async () => {
      const result = await getContacts(filters, 1000);
      const contacts = result.contacts;

      const stats = {
        total: contacts.length,
        byStatus: {
          lead: contacts.filter(c => c.status === 'lead').length,
          prospect: contacts.filter(c => c.status === 'prospect').length,
          customer: contacts.filter(c => c.status === 'customer').length,
          inactive: contacts.filter(c => c.status === 'inactive').length,
        },
        leadScore: {
          hot: contacts.filter(c => (c.leadScore || 0) >= 80).length,
          warm: contacts.filter(c => (c.leadScore || 0) >= 50 && (c.leadScore || 0) < 80).length,
          cold: contacts.filter(c => (c.leadScore || 0) < 50).length,
          average: contacts.reduce((sum, c) => sum + (c.leadScore || 0), 0) / (contacts.length || 1),
        },
        recent: {
          last7Days: contacts.filter(c => {
            const created = new Date(c.createdAt);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return created >= weekAgo;
          }).length,
          last30Days: contacts.filter(c => {
            const created = new Date(c.createdAt);
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
