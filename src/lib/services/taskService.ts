/**
 * Task Service
 *
 * CRUD operations for tasks
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from '../firebase';
import type {
  Task,
  CreateTaskInput,
  UpdateTaskInput,
  TaskStatus,
} from '../types/task.types';

const TASKS_COLLECTION = 'tasks';

/**
 * Create a new task
 */
export async function createTask(input: CreateTaskInput): Promise<string> {
  const taskData = {
    ...input,
    status: 'pending' as TaskStatus,
    dueDate: input.dueDate ? Timestamp.fromDate(input.dueDate) : undefined,
    reminderDate: input.reminderDate
      ? Timestamp.fromDate(input.reminderDate)
      : undefined,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    slaViolated: false,
  };

  const docRef = await addDoc(collection(db, TASKS_COLLECTION), taskData);
  return docRef.id;
}

/**
 * Get task by ID
 */
export async function getTask(taskId: string): Promise<Task | null> {
  const docRef = doc(db, TASKS_COLLECTION, taskId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return {
    id: docSnap.id,
    ...docSnap.data(),
  } as Task;
}

/**
 * Get tasks by assignee
 */
export async function getTasksByAssignee(userId: string): Promise<Task[]> {
  const q = query(
    collection(db, TASKS_COLLECTION),
    where('assignedTo', '==', userId),
    orderBy('dueDate', 'asc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Task[];
}

/**
 * Get tasks by deal
 */
export async function getTasksByDeal(dealId: string): Promise<Task[]> {
  const q = query(
    collection(db, TASKS_COLLECTION),
    where('dealId', '==', dealId),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Task[];
}

/**
 * Get tasks by status
 */
export async function getTasksByStatus(
  userId: string,
  status: TaskStatus
): Promise<Task[]> {
  const q = query(
    collection(db, TASKS_COLLECTION),
    where('assignedTo', '==', userId),
    where('status', '==', status),
    orderBy('dueDate', 'asc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Task[];
}

/**
 * Get overdue tasks
 */
export async function getOverdueTasks(userId?: string): Promise<Task[]> {
  const now = Timestamp.now();
  const constraints: QueryConstraint[] = [
    where('status', 'in', ['pending', 'in_progress']),
    where('dueDate', '<', now),
    orderBy('dueDate', 'asc'),
  ];

  if (userId) {
    constraints.unshift(where('assignedTo', '==', userId));
  }

  const q = query(collection(db, TASKS_COLLECTION), ...constraints);

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Task[];
}

/**
 * Update task
 */
export async function updateTask(
  taskId: string,
  updates: UpdateTaskInput
): Promise<void> {
  const docRef = doc(db, TASKS_COLLECTION, taskId);

  const updateData: any = {
    ...updates,
    updatedAt: serverTimestamp(),
  };

  // Convert dates to Timestamps
  if (updates.dueDate) {
    updateData.dueDate = Timestamp.fromDate(updates.dueDate);
  }
  if (updates.reminderDate) {
    updateData.reminderDate = Timestamp.fromDate(updates.reminderDate);
  }

  await updateDoc(docRef, updateData);
}

/**
 * Complete task
 */
export async function completeTask(
  taskId: string,
  outcome?: string
): Promise<void> {
  const docRef = doc(db, TASKS_COLLECTION, taskId);

  await updateDoc(docRef, {
    status: 'completed' as TaskStatus,
    completedAt: serverTimestamp(),
    outcome: outcome || null,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Mark task as overdue (SLA violation)
 */
export async function markTaskOverdue(taskId: string): Promise<void> {
  const docRef = doc(db, TASKS_COLLECTION, taskId);

  await updateDoc(docRef, {
    status: 'overdue' as TaskStatus,
    slaViolated: true,
    slaViolatedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Cancel task
 */
export async function cancelTask(taskId: string): Promise<void> {
  const docRef = doc(db, TASKS_COLLECTION, taskId);

  await updateDoc(docRef, {
    status: 'cancelled' as TaskStatus,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Delete task
 */
export async function deleteTask(taskId: string): Promise<void> {
  const docRef = doc(db, TASKS_COLLECTION, taskId);
  await deleteDoc(docRef);
}

/**
 * Get tasks created by workflow
 */
export async function getTasksByWorkflow(workflowId: string): Promise<Task[]> {
  const q = query(
    collection(db, TASKS_COLLECTION),
    where('workflowId', '==', workflowId),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Task[];
}

/**
 * Get all pending tasks for today
 */
export async function getTodayTasks(userId: string): Promise<Task[]> {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59
  );

  const q = query(
    collection(db, TASKS_COLLECTION),
    where('assignedTo', '==', userId),
    where('status', 'in', ['pending', 'in_progress']),
    where('dueDate', '>=', Timestamp.fromDate(startOfDay)),
    where('dueDate', '<=', Timestamp.fromDate(endOfDay)),
    orderBy('dueDate', 'asc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Task[];
}
