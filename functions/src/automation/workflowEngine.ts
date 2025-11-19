/**
 * Workflow Execution Engine
 *
 * This module handles the execution of workflow steps in sequence.
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

interface Workflow {
  id: string;
  name: string;
  status: string;
  steps: WorkflowStep[];
  trigger: {
    type: string;
    config: Record<string, any>;
  };
}

/**
 * Execute a complete workflow for an entity
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

    // Create or update enrollment
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
        await workflowDoc.ref.update({
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
    await workflowDoc.ref.update({
      "stats.completed": admin.firestore.FieldValue.increment(1),
    });

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
 * Execute a single workflow step (called from scheduler for delayed steps)
 */
export const executeWorkflowStep = functions.https.onCall(
  async (data, context) => {
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
