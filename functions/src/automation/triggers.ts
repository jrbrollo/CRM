/**
 * Workflow Automation Triggers
 *
 * These functions listen to Firestore events and trigger workflows automatically.
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { executeWorkflow } from "./workflowEngine";

const db = admin.firestore();

/**
 * Trigger when a new contact is created
 */
export const onContactCreated = functions.firestore
  .document("contacts/{contactId}")
  .onCreate(async (snap, context) => {
    const contactId = context.params.contactId;
    const contact = snap.data();

    functions.logger.info(`New contact created: ${contactId}`, { contact });

    try {
      // Find workflows with "form_submit" or "manual" triggers
      const workflowsSnapshot = await db
        .collection("workflows")
        .where("status", "==", "active")
        .where("trigger.type", "in", ["form_submit", "manual"])
        .get();

      // Execute matching workflows
      const promises = workflowsSnapshot.docs.map((workflowDoc) =>
        executeWorkflow(workflowDoc.id, contactId, "contact")
      );

      await Promise.all(promises);

      functions.logger.info(
        `Executed ${promises.length} workflows for new contact ${contactId}`
      );
    } catch (error) {
      functions.logger.error(
        `Error processing workflows for new contact ${contactId}:`,
        error
      );
    }
  });

/**
 * Trigger when a contact is updated
 */
export const onContactUpdated = functions.firestore
  .document("contacts/{contactId}")
  .onUpdate(async (change, context) => {
    const contactId = context.params.contactId;
    const before = change.before.data();
    const after = change.after.data();

    functions.logger.info(`Contact updated: ${contactId}`);

    try {
      // Find workflows with "property_change" trigger
      const workflowsSnapshot = await db
        .collection("workflows")
        .where("status", "==", "active")
        .where("trigger.type", "==", "property_change")
        .get();

      for (const workflowDoc of workflowsSnapshot.docs) {
        const workflow = workflowDoc.data();
        const watchedProperty = workflow.trigger.config?.propertyName;

        // Check if the watched property changed
        if (
          watchedProperty &&
          before[watchedProperty] !== after[watchedProperty]
        ) {
          functions.logger.info(
            `Property ${watchedProperty} changed for contact ${contactId}, executing workflow ${workflowDoc.id}`
          );

          await executeWorkflow(workflowDoc.id, contactId, "contact");
        }
      }
    } catch (error) {
      functions.logger.error(
        `Error processing workflows for updated contact ${contactId}:`,
        error
      );
    }
  });

/**
 * Trigger when a deal stage changes
 */
export const onDealStageChange = functions.firestore
  .document("deals/{dealId}")
  .onUpdate(async (change, context) => {
    const dealId = context.params.dealId;
    const before = change.before.data();
    const after = change.after.data();

    // Check if stage changed
    if (before.stageId === after.stageId) {
      return null;
    }

    functions.logger.info(
      `Deal ${dealId} stage changed from ${before.stageId} to ${after.stageId}`
    );

    try {
      // Find workflows with "deal_stage_change" trigger
      const workflowsSnapshot = await db
        .collection("workflows")
        .where("status", "==", "active")
        .where("trigger.type", "==", "deal_stage_change")
        .get();

      for (const workflowDoc of workflowsSnapshot.docs) {
        const workflow = workflowDoc.data();
        const targetStageId = workflow.trigger.config?.stageId;

        // Check if this is the target stage
        if (!targetStageId || targetStageId === after.stageId) {
          functions.logger.info(
            `Deal ${dealId} reached target stage, executing workflow ${workflowDoc.id}`
          );

          await executeWorkflow(workflowDoc.id, dealId, "deal");
        }
      }
    } catch (error) {
      functions.logger.error(
        `Error processing workflows for deal ${dealId}:`,
        error
      );
    }

    return null;
  });

/**
 * Trigger when a contact is enrolled in a workflow
 */
export const onWorkflowEnrollment = functions.firestore
  .document("workflow_enrollments/{enrollmentId}")
  .onCreate(async (snap, context) => {
    const enrollmentId = context.params.enrollmentId;
    const enrollment = snap.data();

    functions.logger.info(
      `New workflow enrollment: ${enrollmentId}`,
      { enrollment }
    );

    try {
      // Execute the workflow
      await executeWorkflow(
        enrollment.workflowId,
        enrollment.entityId,
        enrollment.entityType
      );
    } catch (error) {
      functions.logger.error(
        `Error executing workflow for enrollment ${enrollmentId}:`,
        error
      );

      // Update enrollment status to failed
      await snap.ref.update({
        status: "failed",
        error: error instanceof Error ? error.message : String(error),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  });
