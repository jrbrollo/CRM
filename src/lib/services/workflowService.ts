/**
 * Workflow Service
 *
 * Manages workflows and enrollment of contacts in automation sequences.
 */

import {
  collection,
  doc,
  query,
  where,
  orderBy,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import {
  Workflow,
  CreateWorkflowInput,
  UpdateWorkflowInput,
  WorkflowEnrollment,
} from '../types';

const WORKFLOWS_COLLECTION = 'workflows';
const ENROLLMENTS_COLLECTION = 'workflow_enrollments';

/**
 * Get all workflows
 */
export async function getWorkflows(status?: string): Promise<Workflow[]> {
  try {
    let q = query(
      collection(db, WORKFLOWS_COLLECTION),
      orderBy('createdAt', 'desc')
    );

    if (status) {
      q = query(q, where('status', '==', status));
    }

    const querySnapshot = await getDocs(q);

    const workflows: Workflow[] = [];
    querySnapshot.forEach((doc) => {
      workflows.push({
        id: doc.id,
        ...doc.data(),
      } as Workflow);
    });

    return workflows;
  } catch (error) {
    console.error('Error getting workflows:', error);
    throw new Error('Erro ao buscar workflows');
  }
}

/**
 * Get a single workflow by ID
 */
export async function getWorkflow(
  workflowId: string
): Promise<Workflow | null> {
  try {
    const docRef = doc(db, WORKFLOWS_COLLECTION, workflowId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as Workflow;
  } catch (error) {
    console.error('Error getting workflow:', error);
    throw new Error('Erro ao buscar workflow');
  }
}

/**
 * Get active workflows
 */
export async function getActiveWorkflows(): Promise<Workflow[]> {
  return getWorkflows('active');
}

/**
 * Create a new workflow
 */
export async function createWorkflow(
  data: CreateWorkflowInput
): Promise<string> {
  try {
    // Generate IDs for steps if not provided
    const steps = data.steps.map((step, index) => ({
      ...step,
      id: step.id || crypto.randomUUID(),
      order: index,
      executionCount: 0,
    }));

    const workflowData = {
      name: data.name,
      description: data.description,
      status: data.status || 'draft',
      trigger: data.trigger,
      steps,
      enrollmentSettings: {
        allowReEnrollment: false,
        suppressForContacts: [],
        ...data.enrollmentSettings,
      },
      stats: {
        totalEnrolled: 0,
        currentlyEnrolled: 0,
        completed: 0,
        goalsMet: 0,
      },
      createdBy: data.createdBy,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(
      collection(db, WORKFLOWS_COLLECTION),
      workflowData
    );

    console.log('✅ Workflow created successfully:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating workflow:', error);
    throw new Error('Erro ao criar workflow');
  }
}

/**
 * Update a workflow
 */
export async function updateWorkflow(
  workflowId: string,
  data: UpdateWorkflowInput
): Promise<void> {
  try {
    const docRef = doc(db, WORKFLOWS_COLLECTION, workflowId);

    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });

    console.log('✅ Workflow updated successfully:', workflowId);
  } catch (error) {
    console.error('Error updating workflow:', error);
    throw new Error('Erro ao atualizar workflow');
  }
}

/**
 * Delete a workflow
 */
export async function deleteWorkflow(workflowId: string): Promise<void> {
  try {
    const docRef = doc(db, WORKFLOWS_COLLECTION, workflowId);
    await deleteDoc(docRef);

    console.log('✅ Workflow deleted successfully:', workflowId);
  } catch (error) {
    console.error('Error deleting workflow:', error);
    throw new Error('Erro ao deletar workflow');
  }
}

/**
 * Activate a workflow
 */
export async function activateWorkflow(workflowId: string): Promise<void> {
  try {
    await updateWorkflow(workflowId, { status: 'active' });
    console.log('✅ Workflow activated:', workflowId);
  } catch (error) {
    console.error('Error activating workflow:', error);
    throw new Error('Erro ao ativar workflow');
  }
}

/**
 * Pause a workflow
 */
export async function pauseWorkflow(workflowId: string): Promise<void> {
  try {
    await updateWorkflow(workflowId, { status: 'paused' });
    console.log('✅ Workflow paused:', workflowId);
  } catch (error) {
    console.error('Error pausing workflow:', error);
    throw new Error('Erro ao pausar workflow');
  }
}

/**
 * Get enrollments for a contact
 */
export async function getContactEnrollments(
  contactId: string
): Promise<WorkflowEnrollment[]> {
  try {
    const q = query(
      collection(db, ENROLLMENTS_COLLECTION),
      where('contactId', '==', contactId),
      orderBy('enrolledAt', 'desc')
    );

    const querySnapshot = await getDocs(q);

    const enrollments: WorkflowEnrollment[] = [];
    querySnapshot.forEach((doc) => {
      enrollments.push({
        id: doc.id,
        ...doc.data(),
      } as WorkflowEnrollment);
    });

    return enrollments;
  } catch (error) {
    console.error('Error getting contact enrollments:', error);
    throw new Error('Erro ao buscar inscrições do contato');
  }
}

/**
 * Get active enrollments for a workflow
 */
export async function getWorkflowEnrollments(
  workflowId: string,
  status?: string
): Promise<WorkflowEnrollment[]> {
  try {
    let q = query(
      collection(db, ENROLLMENTS_COLLECTION),
      where('workflowId', '==', workflowId),
      orderBy('enrolledAt', 'desc')
    );

    if (status) {
      q = query(q, where('status', '==', status));
    }

    const querySnapshot = await getDocs(q);

    const enrollments: WorkflowEnrollment[] = [];
    querySnapshot.forEach((doc) => {
      enrollments.push({
        id: doc.id,
        ...doc.data(),
      } as WorkflowEnrollment);
    });

    return enrollments;
  } catch (error) {
    console.error('Error getting workflow enrollments:', error);
    throw new Error('Erro ao buscar inscrições do workflow');
  }
}

/**
 * Manually enroll a contact in a workflow
 */
export async function manuallyEnrollContact(
  workflowId: string,
  contactId: string
): Promise<string> {
  try {
    // Check if already enrolled
    const existingEnrollments = await getContactEnrollments(contactId);
    const alreadyEnrolled = existingEnrollments.some(
      (e) => e.workflowId === workflowId && e.status === 'active'
    );

    if (alreadyEnrolled) {
      throw new Error('Contato já está inscrito neste workflow');
    }

    const enrollmentData = {
      workflowId,
      contactId,
      status: 'active',
      currentStepIndex: 0,
      enrolledAt: serverTimestamp(),
      metadata: {},
    };

    const docRef = await addDoc(
      collection(db, ENROLLMENTS_COLLECTION),
      enrollmentData
    );

    // Update workflow stats
    const workflow = await getWorkflow(workflowId);
    if (workflow) {
      await updateWorkflow(workflowId, {
        stats: {
          ...workflow.stats,
          totalEnrolled: workflow.stats.totalEnrolled + 1,
          currentlyEnrolled: workflow.stats.currentlyEnrolled + 1,
        },
      });
    }

    console.log('✅ Contact enrolled in workflow:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error enrolling contact:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Erro ao inscrever contato'
    );
  }
}

/**
 * Unenroll a contact from a workflow
 */
export async function unenrollContactFromWorkflow(
  enrollmentId: string
): Promise<void> {
  try {
    const docRef = doc(db, ENROLLMENTS_COLLECTION, enrollmentId);
    const enrollment = await getDoc(docRef);

    if (!enrollment.exists()) {
      throw new Error('Inscrição não encontrada');
    }

    const enrollmentData = enrollment.data() as WorkflowEnrollment;

    await updateDoc(docRef, {
      status: 'unenrolled',
      unenrolledAt: serverTimestamp(),
    });

    // Update workflow stats
    const workflow = await getWorkflow(enrollmentData.workflowId);
    if (workflow) {
      await updateWorkflow(enrollmentData.workflowId, {
        stats: {
          ...workflow.stats,
          currentlyEnrolled: Math.max(
            0,
            workflow.stats.currentlyEnrolled - 1
          ),
        },
      });
    }

    console.log('✅ Contact unenrolled from workflow');
  } catch (error) {
    console.error('Error unenrolling contact:', error);
    throw new Error('Erro ao desinscrever contato');
  }
}

/**
 * Update workflow statistics
 */
export async function updateWorkflowStats(
  workflowId: string,
  updates: Partial<Workflow['stats']>
): Promise<void> {
  try {
    const workflow = await getWorkflow(workflowId);
    if (!workflow) {
      throw new Error('Workflow não encontrado');
    }

    await updateWorkflow(workflowId, {
      stats: {
        ...workflow.stats,
        ...updates,
      },
    });
  } catch (error) {
    console.error('Error updating workflow stats:', error);
    throw new Error('Erro ao atualizar estatísticas do workflow');
  }
}
