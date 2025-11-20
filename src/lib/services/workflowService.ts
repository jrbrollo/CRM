/**
 * Workflow Service
 *
 * CRUD operations for workflows
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
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import type {
  Workflow,
  CreateWorkflowInput,
  UpdateWorkflowInput,
} from '../types/workflow.types';

const WORKFLOWS_COLLECTION = 'workflows';

/**
 * Create a new workflow
 */
export async function createWorkflow(input: CreateWorkflowInput): Promise<string> {
  const workflowData = {
    ...input,
    isActive: input.isActive ?? true,
    priority: input.priority ?? 50,
    runOnce: input.runOnce ?? false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    executionCount: 0,
  };

  const docRef = await addDoc(collection(db, WORKFLOWS_COLLECTION), workflowData);
  return docRef.id;
}

/**
 * Create multiple workflows at once (for batch setup)
 */
export async function createWorkflows(inputs: CreateWorkflowInput[]): Promise<string[]> {
  const ids: string[] = [];

  for (const input of inputs) {
    const id = await createWorkflow(input);
    ids.push(id);
  }

  return ids;
}

/**
 * Get workflow by ID
 */
export async function getWorkflow(workflowId: string): Promise<Workflow | null> {
  const docRef = doc(db, WORKFLOWS_COLLECTION, workflowId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return {
    id: docSnap.id,
    ...docSnap.data(),
  } as Workflow;
}

/**
 * Get all workflows
 */
export async function getWorkflows(): Promise<Workflow[]> {
  const q = query(
    collection(db, WORKFLOWS_COLLECTION),
    orderBy('priority', 'desc'),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Workflow[];
}

/**
 * Get active workflows
 */
export async function getActiveWorkflows(): Promise<Workflow[]> {
  const q = query(
    collection(db, WORKFLOWS_COLLECTION),
    where('isActive', '==', true),
    orderBy('priority', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Workflow[];
}

/**
 * Get workflows by category
 */
export async function getWorkflowsByCategory(
  category: Workflow['category']
): Promise<Workflow[]> {
  const q = query(
    collection(db, WORKFLOWS_COLLECTION),
    where('category', '==', category),
    orderBy('priority', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Workflow[];
}

/**
 * Update workflow
 */
export async function updateWorkflow(
  workflowId: string,
  updates: UpdateWorkflowInput
): Promise<void> {
  const docRef = doc(db, WORKFLOWS_COLLECTION, workflowId);

  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Toggle workflow active status
 */
export async function toggleWorkflowActive(
  workflowId: string,
  isActive: boolean
): Promise<void> {
  const docRef = doc(db, WORKFLOWS_COLLECTION, workflowId);

  await updateDoc(docRef, {
    isActive,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Delete workflow
 */
export async function deleteWorkflow(workflowId: string): Promise<void> {
  const docRef = doc(db, WORKFLOWS_COLLECTION, workflowId);
  await deleteDoc(docRef);
}

/**
 * Update execution stats
 */
export async function incrementWorkflowExecutionCount(
  workflowId: string
): Promise<void> {
  const workflow = await getWorkflow(workflowId);
  if (!workflow) return;

  const docRef = doc(db, WORKFLOWS_COLLECTION, workflowId);

  await updateDoc(docRef, {
    executionCount: (workflow.executionCount || 0) + 1,
    lastExecutedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Delete all workflows (for reset)
 */
export async function deleteAllWorkflows(): Promise<void> {
  const workflows = await getWorkflows();

  for (const workflow of workflows) {
    await deleteWorkflow(workflow.id);
  }
}
