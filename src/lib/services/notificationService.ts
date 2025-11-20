/**
 * Notification Service
 *
 * CRUD operations for notifications
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import type {
  Notification,
  CreateNotificationInput,
  NotificationStatus,
} from '../types/notification.types';

const NOTIFICATIONS_COLLECTION = 'notifications';

/**
 * Create a new notification
 */
export async function createNotification(
  input: CreateNotificationInput
): Promise<string> {
  const notificationData = {
    ...input,
    priority: input.priority || 'medium',
    status: 'unread' as NotificationStatus,
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(
    collection(db, NOTIFICATIONS_COLLECTION),
    notificationData
  );
  return docRef.id;
}

/**
 * Get notifications for a user
 */
export async function getNotifications(
  userId: string,
  limitCount: number = 50
): Promise<Notification[]> {
  const q = query(
    collection(db, NOTIFICATIONS_COLLECTION),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Notification[];
}

/**
 * Get unread notifications
 */
export async function getUnreadNotifications(
  userId: string
): Promise<Notification[]> {
  const q = query(
    collection(db, NOTIFICATIONS_COLLECTION),
    where('userId', '==', userId),
    where('status', '==', 'unread'),
    orderBy('createdAt', 'desc'),
    limit(50)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Notification[];
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(userId: string): Promise<number> {
  const notifications = await getUnreadNotifications(userId);
  return notifications.length;
}

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId: string): Promise<void> {
  const docRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);

  await updateDoc(docRef, {
    status: 'read' as NotificationStatus,
    readAt: serverTimestamp(),
  });
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(userId: string): Promise<void> {
  const unreadNotifications = await getUnreadNotifications(userId);

  const promises = unreadNotifications.map((notification) =>
    markAsRead(notification.id)
  );

  await Promise.all(promises);
}

/**
 * Archive notification
 */
export async function archiveNotification(notificationId: string): Promise<void> {
  const docRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);

  await updateDoc(docRef, {
    status: 'archived' as NotificationStatus,
    archivedAt: serverTimestamp(),
  });
}

/**
 * Send notification to multiple users
 */
export async function sendBulkNotifications(
  userIds: string[],
  input: Omit<CreateNotificationInput, 'userId'>
): Promise<void> {
  const promises = userIds.map((userId) =>
    createNotification({ ...input, userId })
  );

  await Promise.all(promises);
}
