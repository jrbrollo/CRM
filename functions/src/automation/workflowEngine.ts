/**
 * Workflow Execution Engine
 *
 * This module handles the execution of workflow steps in sequence or as a graph.
 * Supports both legacy format (sequential steps) and new format (graph with conditions).
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { executeStep } from "./executors";

const db = admin.firestore();

interface WorkflowStep {
  id: string;
  type: string;
  name: string;
  config: Record<string, any>;
  order: number;
}

interface WorkflowGraphNode {
  id: string;
  type: string;
  nextId?: string; // For linear nodes
  trueNextId?: string; // For condition nodes (true path)
  falseNextId?: string; // For condition nodes (false path)
  config: Record<string, any>;
}

interface WorkflowGraph {
  nodes: Record<string, WorkflowGraphNode>;
  triggerNodeId: string;
}

interface Workflow {
  id: string;
  name: string;
  status: string;
  steps: WorkflowStep[];
  graph?: WorkflowGraph; // New graph format
  trigger: {
    type: string;
    config: Record<string, any>;
  };
}

/**
 * Execute a complete workflow for an entity
 * Auto-detects format (graph vs legacy) and executes appropriately
 */
export async function executeWorkflow(
  workflowId: string,
  entityId: string,
  entityType: "contact" | "deal"
): Promise<void> {
  functions.logger.info(
    `Executing workflow ${workflowId} for ${entityType} ${entityId}`
  );

  try {
    // Get workflow
    const workflowDoc = await db.collection("workflows").doc(workflowId).get();

    if (!workflowDoc.exists) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    const workflow = {
      id: workflowDoc.id,
      ...workflowDoc.data(),
    } as Workflow;

    // Check if workflow is active
    if (workflow.status !== "active") {
      functions.logger.warn(
        `Workflow ${workflowId} is not active, skipping execution`
      );
      return;
    }

    // Detect format and execute appropriately
    if (workflow.graph) {
      functions.logger.info(`Executing workflow ${workflowId} as graph`);
      await executeWorkflowGraph(
        workflow.graph,
        entityId,
        entityType,
        workflowId,
        workflowDoc.ref
      );
    } else {
      functions.logger.info(`Executing workflow ${workflowId} as legacy (sequential)`);
      await executeWorkflowLegacy(
        workflow,
        entityId,
        entityType,
        workflowId,
        workflowDoc.ref
      );
    }

    functions.logger.info(
      `Successfully completed workflow ${workflowId} for ${entityType} ${entityId}`
    );
  } catch (error) {
    functions.logger.error(
      `Failed to execute workflow ${workflowId} for ${entityType} ${entityId}:`,
      error
    );
    throw error;
  }
}

/**
 * Execute workflow in new graph format (supports conditions with true/false paths)
 */
async function executeWorkflowGraph(
  graph: WorkflowGraph,
  entityId: string,
  entityType: "contact" | "deal",
  workflowId: string,
  workflowRef: admin.firestore.DocumentReference
): Promise<void> {
  const enrollmentRef = db.collection("workflow_enrollments").doc();

  await enrollmentRef.set({
    workflowId,
    entityId,
    entityType,
    status: "in_progress",
    currentNodeId: graph.triggerNodeId,
    startedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Start from trigger node
  let currentNodeId: string | undefined = graph.triggerNodeId;
  const executedNodes = new Set<string>(); // Prevent infinite loops
  const maxIterations = 100; // Safety limit
  let iterations = 0;

  while (currentNodeId && iterations < maxIterations) {
    iterations++;

    // Loop protection
    if (executedNodes.has(currentNodeId)) {
      throw new Error(`Infinite loop detected at node ${currentNodeId}`);
    }
    executedNodes.add(currentNodeId);

    const node: WorkflowGraphNode | undefined = graph.nodes[currentNodeId];

    if (!node) {
      throw new Error(`Node ${currentNodeId} not found in workflow graph`);
    }

    functions.logger.info(
      `Executing node ${currentNodeId} (${node.type}) [${iterations}/${maxIterations}]`
    );

    try {
      // Execute the step
      await executeStep(node, entityId, entityType, workflowId);

      // Update enrollment
      await enrollmentRef.update({
        currentNodeId,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Determine next node
      if (node.type === "conditional") {
        // Evaluate condition and choose path
        const conditionResult = await evaluateCondition(
          node.config,
          entityId,
          entityType
        );

        currentNodeId = conditionResult ? node.trueNextId : node.falseNextId;

        functions.logger.info(
          `Condition evaluated to ${conditionResult}, next node: ${currentNodeId || "END"}`
        );
      } else {
        // Linear node - follow nextId
        currentNodeId = node.nextId;
      }
    } catch (error) {
      functions.logger.error(`Error executing node ${currentNodeId}:`, error);

      await enrollmentRef.update({
        status: "failed",
        error: error instanceof Error ? error.message : String(error),
        failedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      throw error;
    }
  }

  if (iterations >= maxIterations) {
    throw new Error(`Workflow exceeded maximum iterations (${maxIterations})`);
  }

  // Workflow completed
  await enrollmentRef.update({
    status: "completed",
    completedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Update stats
  await workflowRef.update({
    "stats.completed": admin.firestore.FieldValue.increment(1),
  });
}

/**
 * Execute workflow in legacy format (sequential steps array)
 * Maintained for backwards compatibility
 */
async function executeWorkflowLegacy(
  workflow: Workflow,
  entityId: string,
  entityType: "contact" | "deal",
  workflowId: string,
  workflowRef: admin.firestore.DocumentReference
): Promise<void> {
  const enrollmentRef = db.collection("workflow_enrollments").doc();

  await enrollmentRef.set({
    workflowId,
    entityId,
    entityType,
    status: "in_progress",
    currentStepIndex: 0,
    startedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Execute steps sequentially
  const steps = workflow.steps.sort((a, b) => a.order - b.order);

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];

    functions.logger.info(
      `Executing step ${i + 1}/${steps.length}: ${step.type}`
    );

    try {
      await executeStep(step, entityId, entityType, workflowId);

      // Update enrollment progress
      await enrollmentRef.update({
        currentStepIndex: i + 1,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Update workflow stats
      await workflowRef.update({
        [`steps.${i}.executionCount`]: admin.firestore.FieldValue.increment(1),
      });
    } catch (error) {
      functions.logger.error(
        `Error executing step ${step.id} in workflow ${workflowId}:`,
        error
      );

      // Update enrollment with error
      await enrollmentRef.update({
        status: "failed",
        error: error instanceof Error ? error.message : String(error),
        failedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      throw error;
    }
  }

  // Mark enrollment as completed
  await enrollmentRef.update({
    status: "completed",
    completedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Update workflow stats
  await workflowRef.update({
    "stats.completed": admin.firestore.FieldValue.increment(1),
  });
}

/**
 * Evaluate a condition node and return true/false
 */
async function evaluateCondition(
  config: Record<string, any>,
  entityId: string,
  entityType: "contact" | "deal"
): Promise<boolean> {
  const { field, operator, value } = config;

  if (!field || !operator) {
    functions.logger.warn("Condition missing field or operator, defaulting to false");
    return false;
  }

  // Fetch entity data
  const collection = entityType === "contact" ? "contacts" : "deals";
  const entityDoc = await db.collection(collection).doc(entityId).get();

  if (!entityDoc.exists) {
    throw new Error(`${entityType} ${entityId} not found`);
  }

  const entityData = entityDoc.data()!;
  const fieldValue = entityData[field];

  functions.logger.info(
    `Evaluating condition: ${field} ${operator} ${value} (actual: ${fieldValue})`
  );

  // Evaluate based on operator
  switch (operator) {
    case "equals":
    case "==":
      return fieldValue == value; // Loose equality

    case "not_equals":
    case "!=":
      return fieldValue != value;

    case "greater_than":
    case ">":
      return Number(fieldValue) > Number(value);

    case "less_than":
    case "<":
      return Number(fieldValue) < Number(value);

    case "greater_than_or_equal":
    case ">=":
      return Number(fieldValue) >= Number(value);

    case "less_than_or_equal":
    case "<=":
      return Number(fieldValue) <= Number(value);

    case "contains":
      return String(fieldValue).toLowerCase().includes(String(value).toLowerCase());

    case "not_contains":
      return !String(fieldValue).toLowerCase().includes(String(value).toLowerCase());

    case "is_empty":
      return !fieldValue || fieldValue === "" || fieldValue === null;

    case "is_not_empty":
      return !!fieldValue && fieldValue !== "";

    case "starts_with":
      return String(fieldValue).toLowerCase().startsWith(String(value).toLowerCase());

    case "ends_with":
      return String(fieldValue).toLowerCase().endsWith(String(value).toLowerCase());

    default:
      functions.logger.warn(`Unknown operator: ${operator}, defaulting to false`);
      return false;
  }
}

/**
 * Execute a single workflow step (called from scheduler for delayed steps)
 */
export const executeWorkflowStep = functions.https.onCall(
  async (
    data: {
      workflowId: string;
      stepId: string;
      entityId: string;
      entityType: "contact" | "deal";
    },
    context: functions.https.CallableContext
  ) => {
    // Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated"
      );
    }

    const { workflowId, stepId, entityId, entityType } = data;

    if (!workflowId || !stepId || !entityId || !entityType) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Missing required parameters"
      );
    }

    try {
      // Get workflow and step
      const workflowDoc = await db.collection("workflows").doc(workflowId).get();

      if (!workflowDoc.exists) {
        throw new Error(`Workflow ${workflowId} not found`);
      }

      const workflow = workflowDoc.data() as Workflow;
      const step = workflow.steps.find((s) => s.id === stepId);

      if (!step) {
        throw new Error(`Step ${stepId} not found in workflow ${workflowId}`);
      }

      // Execute the step
      await executeStep(step, entityId, entityType, workflowId);

      return { success: true, message: "Step executed successfully" };
    } catch (error) {
      functions.logger.error(
        `Error in executeWorkflowStep for workflow ${workflowId}, step ${stepId}:`,
        error
      );

      throw new functions.https.HttpsError(
        "internal",
        error instanceof Error ? error.message : "Unknown error occurred"
      );
    }
  }
);
