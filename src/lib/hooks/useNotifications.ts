/**
 * Notification Hooks
 *
 * React Query hooks for notifications
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getNotifications,
  getUnreadNotifications,
  getUnreadCount,
  createNotification,
  markAsRead,
  markAllAsRead,
  archiveNotification,
} from '../services/notificationService';
import type { CreateNotificationInput } from '../types/notification.types';

/**
 * Get all notifications for user
 */
export function useNotifications(userId: string, limitCount?: number) {
  return useQuery({
    queryKey: ['notifications', userId, limitCount],
    queryFn: () => getNotifications(userId, limitCount),
    staleTime: 30 * 1000, // 30 seconds
    enabled: !!userId,
  });
}

/**
 * Get unread notifications
 */
export function useUnreadNotifications(userId: string) {
  return useQuery({
    queryKey: ['notifications', 'unread', userId],
    queryFn: () => getUnreadNotifications(userId),
    staleTime: 30 * 1000, // 30 seconds
    enabled: !!userId,
  });
}

/**
 * Get unread count
 */
export function useUnreadCount(userId: string) {
  return useQuery({
    queryKey: ['notifications', 'unread-count', userId],
    queryFn: () => getUnreadCount(userId),
    staleTime: 30 * 1000, // 30 seconds
    enabled: !!userId,
  });
}

/**
 * Create notification
 */
export function useCreateNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateNotificationInput) => createNotification(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['notifications', variables.userId],
      });
      queryClient.invalidateQueries({
        queryKey: ['notifications', 'unread', variables.userId],
      });
      queryClient.invalidateQueries({
        queryKey: ['notifications', 'unread-count', variables.userId],
      });
    },
  });
}

/**
 * Mark notification as read
 */
export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) => markAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

/**
 * Mark all as read
 */
export function useMarkAllAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => markAllAsRead(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

/**
 * Archive notification
 */
export function useArchiveNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) => archiveNotification(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
