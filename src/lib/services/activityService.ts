/**
 * Activity Service
 *
 * Handles all activities including notes, emails, calls, meetings, tasks.
 * Critical for workflow automation and checklist tracking.
 */

import {
  collection,
  doc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  DocumentSnapshot,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import {
  Activity,
  CreateActivityInput,
  UpdateActivityInput,
  ActivityFilters,
} from '../types';

const COLLECTION_NAME = 'activities';

/**
 * Get all activities with optional filters
 */
export async function getActivities(
  filters?: ActivityFilters,
  pageLimit: number = 50,
  startAfterDoc?: DocumentSnapshot
): Promise<{ activities: Activity[]; lastDoc?: DocumentSnapshot }> {
  try {
    // Build query constraints
    const constraints: QueryConstraint[] = [];

    // Apply filters
    if (filters?.type) {
      if (Array.isArray(filters.type)) {
        constraints.push(where('type', 'in', filters.type));
      } else {
        constraints.push(where('type', '==', filters.type));
      }
    }

    if (filters?.contactId) {
      constraints.push(where('contactId', '==', filters.contactId));
    }

    if (filters?.dealId) {
      constraints.push(where('dealId', '==', filters.dealId));
    }

    if (filters?.ownerId) {
      constraints.push(where('ownerId', '==', filters.ownerId));
    }

    if (filters?.status) {
      constraints.push(where('status', '==', filters.status));
    }

    if (filters?.workflowId) {
      constraints.push(where('workflowId', '==', filters.workflowId));
    }

    if (filters?.automationTriggered !== undefined) {
      constraints.push(
        where('automationTriggered', '==', filters.automationTriggered)
      );
    }

    // Ordering and pagination
    constraints.push(orderBy('createdAt', 'desc'));
    constraints.push(limit(pageLimit));

    if (startAfterDoc) {
      constraints.push(startAfterDoc);
    }

    // Execute query
    const q = query(collection(db, COLLECTION_NAME), ...constraints);
    const querySnapshot = await getDocs(q);

    const activities: Activity[] = [];
    querySnapshot.forEach((doc) => {
      activities.push({
        id: doc.id,
        ...doc.data(),
      } as Activity);
    });

    const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];

    return { activities, lastDoc };
  } catch (error) {
    console.error('Error getting activities:', error);
    throw new Error(
      `Erro ao buscar atividades: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    );
  }
}

/**
 * Get a single activity by ID
 */
export async function getActivity(activityId: string): Promise<Activity | null> {
  try {
    const docRef = doc(db, COLLECTION_NAME, activityId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as Activity;
  } catch (error) {
    console.error('Error getting activity:', error);
    throw new Error(
      `Erro ao buscar atividade: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    );
  }
}

/**
 * Get activities timeline for a contact
 */
export async function getContactTimeline(
  contactId: string,
  pageLimit: number = 50
): Promise<Activity[]> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('contactId', '==', contactId),
      orderBy('createdAt', 'desc'),
      limit(pageLimit)
    );

    const querySnapshot = await getDocs(q);

    const activities: Activity[] = [];
    querySnapshot.forEach((doc) => {
      activities.push({
        id: doc.id,
        ...doc.data(),
      } as Activity);
    });

    return activities;
  } catch (error) {
    console.error('Error getting contact timeline:', error);
    throw new Error('Erro ao buscar timeline do contato');
  }
}

/**
 * Get pending tasks for a user
 */
export async function getPendingTasks(
  ownerId: string,
  overdueOnly: boolean = false
): Promise<Activity[]> {
  try {
    const constraints: QueryConstraint[] = [
      where('type', '==', 'task'),
      where('ownerId', '==', ownerId),
      where('status', '==', 'pending'),
    ];

    if (overdueOnly) {
      constraints.push(where('dueDate', '<', Timestamp.now()));
    }

    constraints.push(orderBy('dueDate', 'asc'));

    const q = query(collection(db, COLLECTION_NAME), ...constraints);
    const querySnapshot = await getDocs(q);

    const tasks: Activity[] = [];
    querySnapshot.forEach((doc) => {
      tasks.push({
        id: doc.id,
        ...doc.data(),
      } as Activity);
    });

    return tasks;
  } catch (error) {
    console.error('Error getting pending tasks:', error);
    throw new Error('Erro ao buscar tarefas pendentes');
  }
}

/**
 * Create a new activity
 */
export async function createActivity(
  data: CreateActivityInput
): Promise<string> {
  try {
    const activityData = {
      ...data,
      automationTriggered: data.automationTriggered || false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), activityData);

    console.log('✅ Activity created successfully:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating activity:', error);
    throw new Error(
      `Erro ao criar atividade: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    );
  }
}

/**
 * Update an existing activity
 */
export async function updateActivity(
  activityId: string,
  data: UpdateActivityInput
): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, activityId);

    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });

    console.log('✅ Activity updated successfully:', activityId);
  } catch (error) {
    console.error('Error updating activity:', error);
    throw new Error(
      `Erro ao atualizar atividade: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    );
  }
}

/**
 * Mark task as completed
 */
export async function completeTask(activityId: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, activityId);
    await updateDoc(docRef, {
      status: 'completed',
      completedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    console.log('✅ Task completed:', activityId);
  } catch (error) {
    console.error('Error completing task:', error);
    throw new Error('Erro ao completar tarefa');
  }
}

/**
 * Cancel task
 */
export async function cancelTask(activityId: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, activityId);
    await updateDoc(docRef, {
      status: 'cancelled',
      updatedAt: serverTimestamp(),
    });

    console.log('✅ Task cancelled:', activityId);
  } catch (error) {
    console.error('Error cancelling task:', error);
    throw new Error('Erro ao cancelar tarefa');
  }
}

/**
 * Delete an activity
 */
export async function deleteActivity(activityId: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, activityId);
    await deleteDoc(docRef);

    console.log('✅ Activity deleted successfully:', activityId);
  } catch (error) {
    console.error('Error deleting activity:', error);
    throw new Error(
      `Erro ao deletar atividade: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    );
  }
}

/**
 * Create a note for a contact or deal
 */
export async function createNote(
  ownerId: string,
  description: string,
  contactId?: string,
  dealId?: string
): Promise<string> {
  return createActivity({
    type: 'note',
    ownerId,
    description,
    contactId,
    dealId,
  });
}

/**
 * Log an email activity
 */
export async function logEmail(
  ownerId: string,
  subject: string,
  description: string,
  contactId?: string,
  dealId?: string,
  workflowId?: string,
  workflowStepId?: string
): Promise<string> {
  return createActivity({
    type: 'email',
    ownerId,
    subject,
    description,
    contactId,
    dealId,
    workflowId,
    workflowStepId,
    automationTriggered: !!workflowId,
  });
}

/**
 * Log a phone call
 */
export async function logCall(
  ownerId: string,
  description: string,
  contactId?: string,
  dealId?: string
): Promise<string> {
  return createActivity({
    type: 'call',
    ownerId,
    description,
    contactId,
    dealId,
  });
}

/**
 * Schedule a meeting
 */
export async function scheduleMeeting(
  ownerId: string,
  subject: string,
  description: string,
  dueDate: Date,
  contactId?: string,
  dealId?: string
): Promise<string> {
  return createActivity({
    type: 'meeting',
    ownerId,
    subject,
    description,
    dueDate,
    contactId,
    dealId,
    status: 'pending',
  });
}

/**
 * Create a task (manual or automated)
 */
export async function createTask(
  ownerId: string,
  subject: string,
  description: string,
  dueDate: Date,
  contactId?: string,
  dealId?: string,
  workflowId?: string,
  workflowStepId?: string
): Promise<string> {
  return createActivity({
    type: 'task',
    ownerId,
    subject,
    description,
    dueDate,
    status: 'pending',
    contactId,
    dealId,
    workflowId,
    workflowStepId,
    automationTriggered: !!workflowId,
  });
}

/**
 * Get overdue tasks count for a user
 */
export async function getOverdueTasksCount(ownerId: string): Promise<number> {
  try {
    const tasks = await getPendingTasks(ownerId, true);
    return tasks.length;
  } catch (error) {
    console.error('Error getting overdue tasks count:', error);
    return 0;
  }
}

/**
 * Get tasks due today for a user
 */
export async function getTasksDueToday(ownerId: string): Promise<Activity[]> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const q = query(
      collection(db, COLLECTION_NAME),
      where('type', '==', 'task'),
      where('ownerId', '==', ownerId),
      where('status', '==', 'pending'),
      where('dueDate', '>=', Timestamp.fromDate(today)),
      where('dueDate', '<', Timestamp.fromDate(tomorrow)),
      orderBy('dueDate', 'asc')
    );

    const querySnapshot = await getDocs(q);

    const tasks: Activity[] = [];
    querySnapshot.forEach((doc) => {
      tasks.push({
        id: doc.id,
        ...doc.data(),
      } as Activity);
    });

    return tasks;
  } catch (error) {
    console.error('Error getting tasks due today:', error);
    throw new Error('Erro ao buscar tarefas de hoje');
  }
}
