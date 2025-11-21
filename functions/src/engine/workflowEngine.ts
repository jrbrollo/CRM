/**
 * Workflow Execution Engine - The Core
 *
 * Processa WorkflowEnrollments node por node de forma distribuída e assíncrona
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { executeActionNode } from './executors/actionExecutor';
import { evaluateConditionNode } from './executors/conditionExecutor';

const db = admin.firestore();

// Types (importar do frontend quando compartilhado)
type EnrollmentStatus = 'active' | 'waiting' | 'completed' | 'failed' | 'cancelled';

interface WorkflowEnrollment {
  id: string;
  workflowId: string;
  targetType: 'deal' | 'contact' | 'task';
  targetId: string;
  status: EnrollmentStatus;
  currentNodeId: string;
  visitedNodes: string[];
  executionPath: Array<{
    nodeId: string;
    timestamp: admin.firestore.Timestamp;
    result?: 'success' | 'failed';
    error?: string;
  }>;
  nextExecutionAt?: admin.firestore.Timestamp;
  context?: Record<string, any>;
  startedAt: admin.firestore.Timestamp;
  completedAt?: admin.firestore.Timestamp;
  lastExecutedAt?: admin.firestore.Timestamp;
  errorCount: number;
  lastError?: string;
  retryCount?: number;
  maxRetries?: number;
}

interface WorkflowNode {
  id: string;
  type: 'trigger' | 'action' | 'condition' | 'delay' | 'end';
  nextId?: string;
  [key: string]: any;
}

interface WorkflowDefinition {
  id: string;
  name: string;
  isActive: boolean;
  nodes: Record<string, WorkflowNode>;
  startNodeId: string;
}

const MAX_NODES_PER_EXECUTION = 100;
const MAX_RETRIES = 3;

/**
 * Main Engine - Triggered when an enrollment is created or updated
 *
 * Firestore Trigger: onCreate ou onUpdate de workflowEnrollments/{enrollmentId}
 */
export const workflowExecutionEngine = functions.firestore
  .document('workflowEnrollments/{enrollmentId}')
  .onWrite(async (change, context) => {
    const enrollmentId = context.params.enrollmentId;

    // Skip se foi deletado
    if (!change.after.exists) {
      return;
    }

    const enrollment = {
      id: enrollmentId,
      ...change.after.data(),
    } as WorkflowEnrollment;

    // Só processar se status = 'active'
    if (enrollment.status !== 'active') {
      functions.logger.info(
        `Enrollment ${enrollmentId} status is ${enrollment.status}, skipping`
      );
      return;
    }

    // Evitar execuções duplicadas (idempotência)
    const lastExecutedAt = enrollment.lastExecutedAt?.toDate().getTime() || 0;
    const now = Date.now();
    if (now - lastExecutedAt < 1000) {
      // Se executou há menos de 1 segundo, skip
      functions.logger.info(`Enrollment ${enrollmentId} executed recently, skipping`);
      return;
    }

    try {
      await executeEnrollment(enrollmentId, enrollment);
    } catch (error) {
      functions.logger.error(`Fatal error executing enrollment ${enrollmentId}:`, error);
      await markEnrollmentFailed(
        enrollmentId,
        error instanceof Error ? error.message : String(error)
      );
    }
  });

/**
 * Execute Enrollment - Processa os nós até completion ou waiting
 */
async function executeEnrollment(
  enrollmentId: string,
  enrollment: WorkflowEnrollment
): Promise<void> {
  functions.logger.info(`Starting execution for enrollment ${enrollmentId}`);

  // Buscar workflow definition
  const workflowDoc = await db
    .collection('workflowDefinitions')
    .doc(enrollment.workflowId)
    .get();

  if (!workflowDoc.exists) {
    throw new Error(`Workflow ${enrollment.workflowId} not found`);
  }

  const workflow = {
    id: workflowDoc.id,
    ...workflowDoc.data(),
  } as WorkflowDefinition;

  if (!workflow.isActive) {
    functions.logger.warn(`Workflow ${workflow.id} is not active, completing enrollment`);
    await markEnrollmentCompleted(enrollmentId);
    return;
  }

  // Buscar o target (deal/contact/task)
  const targetData = await fetchTargetData(
    enrollment.targetType,
    enrollment.targetId
  );

  if (!targetData) {
    throw new Error(`Target ${enrollment.targetType}/${enrollment.targetId} not found`);
  }

  // Execution loop - processar nós até completar ou pausar
  let currentNodeId = enrollment.currentNodeId;
  let nodesExecuted = 0;
  const maxNodes = MAX_NODES_PER_EXECUTION;

  while (currentNodeId && nodesExecuted < maxNodes) {
    // Buscar nó atual
    const node = workflow.nodes[currentNodeId];

    if (!node) {
      throw new Error(`Node ${currentNodeId} not found in workflow ${workflow.id}`);
    }

    functions.logger.info(`Executing node ${currentNodeId} (type: ${node.type})`);

    // Detectar loops - se já visitamos este nó recentemente
    if (enrollment.visitedNodes.includes(currentNodeId)) {
      const visitCount = enrollment.visitedNodes.filter(id => id === currentNodeId).length;
      if (visitCount > 5) {
        throw new Error(`Loop detected: node ${currentNodeId} visited ${visitCount} times`);
      }
    }

    // Executar nó baseado no tipo
    let result: {
      success: boolean;
      nextNodeId?: string;
      error?: string;
      shouldWait?: boolean;
      waitUntil?: admin.firestore.Timestamp;
      context?: Record<string, any>;
    };

    try {
      switch (node.type) {
        case 'action':
          result = await executeActionNode(node, targetData, enrollment.context || {});
          break;

        case 'condition':
          result = await evaluateConditionNode(node, targetData, enrollment.context || {});
          break;

        case 'delay':
          result = await executeDelayNode(node);
          break;

        case 'end':
          result = { success: true }; // Finaliza
          break;

        default:
          throw new Error(`Unknown node type: ${node.type}`);
      }
    } catch (error) {
      result = {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }

    // Atualizar path de execução
    const pathEntry = {
      nodeId: currentNodeId,
      timestamp: admin.firestore.Timestamp.now(),
      result: result.success ? 'success' : 'failed',
      error: result.error,
    };

    // Se falhou e temos errorNextId, seguir caminho de erro
    if (!result.success && node.errorNextId) {
      currentNodeId = node.errorNextId;
    } else if (result.shouldWait) {
      // Delay - pausar execução
      await pauseEnrollment(enrollmentId, currentNodeId, result.waitUntil!, pathEntry);
      return; // STOP aqui
    } else if (result.nextNodeId) {
      // Próximo nó especificado pelo resultado (ex: condition)
      currentNodeId = result.nextNodeId;
    } else if (node.nextId) {
      // Próximo nó padrão
      currentNodeId = node.nextId;
    } else {
      // Sem próximo nó = fim do workflow
      currentNodeId = '';
    }

    // Atualizar enrollment no Firestore
    await db.collection('workflowEnrollments').doc(enrollmentId).update({
      currentNodeId: currentNodeId || 'completed',
      visitedNodes: admin.firestore.FieldValue.arrayUnion(node.id),
      executionPath: admin.firestore.FieldValue.arrayUnion(pathEntry),
      context: { ...(enrollment.context || {}), ...(result.context || {}) },
      lastExecutedAt: admin.firestore.Timestamp.now(),
    });

    nodesExecuted++;
  }

  // Se saiu do loop sem currentNodeId, completou
  if (!currentNodeId) {
    await markEnrollmentCompleted(enrollmentId);
  } else if (nodesExecuted >= maxNodes) {
    functions.logger.warn(
      `Enrollment ${enrollmentId} hit max nodes limit (${maxNodes}), will continue in next cycle`
    );
    // Força re-trigger (onUpdate) para continuar
    await db.collection('workflowEnrollments').doc(enrollmentId).update({
      lastExecutedAt: admin.firestore.Timestamp.now(),
    });
  }
}

/**
 * Execute Delay Node - Calcula timestamp futuro
 */
async function executeDelayNode(node: WorkflowNode): Promise<{
  success: boolean;
  shouldWait: true;
  waitUntil: admin.firestore.Timestamp;
}> {
  const { delayMinutes = 0, delayHours = 0, delayDays = 0 } = node;

  const totalMinutes = delayMinutes + delayHours * 60 + delayDays * 24 * 60;
  const waitUntil = new Date(Date.now() + totalMinutes * 60 * 1000);

  functions.logger.info(`Delay node: waiting ${totalMinutes} minutes until ${waitUntil}`);

  return {
    success: true,
    shouldWait: true,
    waitUntil: admin.firestore.Timestamp.fromDate(waitUntil),
  };
}

/**
 * Pause Enrollment - Muda status para 'waiting'
 */
async function pauseEnrollment(
  enrollmentId: string,
  currentNodeId: string,
  waitUntil: admin.firestore.Timestamp,
  pathEntry: any
): Promise<void> {
  functions.logger.info(`Pausing enrollment ${enrollmentId} until ${waitUntil.toDate()}`);

  await db.collection('workflowEnrollments').doc(enrollmentId).update({
    status: 'waiting',
    currentNodeId,
    nextExecutionAt: waitUntil,
    executionPath: admin.firestore.FieldValue.arrayUnion(pathEntry),
    lastExecutedAt: admin.firestore.Timestamp.now(),
  });
}

/**
 * Mark Enrollment as Completed
 */
async function markEnrollmentCompleted(enrollmentId: string): Promise<void> {
  functions.logger.info(`Completing enrollment ${enrollmentId}`);

  await db.collection('workflowEnrollments').doc(enrollmentId).update({
    status: 'completed',
    completedAt: admin.firestore.Timestamp.now(),
  });
}

/**
 * Mark Enrollment as Failed
 */
async function markEnrollmentFailed(enrollmentId: string, error: string): Promise<void> {
  functions.logger.error(`Failing enrollment ${enrollmentId}: ${error}`);

  await db.collection('workflowEnrollments').doc(enrollmentId).update({
    status: 'failed',
    lastError: error,
    errorCount: admin.firestore.FieldValue.increment(1),
    completedAt: admin.firestore.Timestamp.now(),
  });
}

/**
 * Fetch Target Data - Busca o deal/contact/task
 */
async function fetchTargetData(
  targetType: string,
  targetId: string
): Promise<any> {
  const collectionName =
    targetType === 'deal' ? 'deals' : targetType === 'contact' ? 'contacts' : 'tasks';

  const doc = await db.collection(collectionName).doc(targetId).get();

  return doc.exists ? { id: doc.id, ...doc.data() } : null;
}
