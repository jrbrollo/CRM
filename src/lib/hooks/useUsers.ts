/**
 * User Hooks
 *
 * React Query hooks for managing users/team members.
 */

import { useQuery } from '@tanstack/react-query';
import { collection, query, getDocs, orderBy, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface User {
  id: string;
  email: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  isActive?: boolean;
  createdAt?: any;
}

// Query Keys
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  active: () => [...userKeys.all, 'active'] as const,
};

/**
 * Hook to fetch all users
 */
export function useUsers() {
  return useQuery({
    queryKey: userKeys.lists(),
    queryFn: async () => {
      const q = query(
        collection(db, 'users'),
        orderBy('displayName', 'asc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as User[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch active users only
 */
export function useActiveUsers() {
  return useQuery({
    queryKey: userKeys.active(),
    queryFn: async () => {
      const q = query(
        collection(db, 'users'),
        where('isActive', '==', true),
        orderBy('displayName', 'asc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as User[];
    },
    staleTime: 5 * 60 * 1000,
  });
}
