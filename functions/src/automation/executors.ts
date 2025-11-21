/**
 * Workflow Step Executors
 *
 * This module contains functions to execute different types of workflow steps.
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { sendEmail } from "../services/emailService";

const db = admin.firestore();

interface WorkflowStep {
  id: string;
  type: string;
  name: string;
  config: Record<string, any>;
}

/**
 * Main dispatcher for step execution
 */
export async function executeStep(
  step: WorkflowStep,
  entityId: string,
  entityType: "contact" | "deal",
  workflowId: string
): Promise<void> {
  functions.logger.info(`Executing step type: ${step.type}`, {
    stepId: step.id,
    entityId,
    entityType,
  });

  switch (step.type) {
    case "delay":
      await executeDelay(step, entityId, entityType, workflowId);
      break;

    case "send_email":
      await executeSendEmail(step, entityId, entityType);
      break;

    case "send_whatsapp":
      await executeSendWhatsApp(step, entityId, entityType);
      break;

    case "create_task":
      await executeCreateTask(step, entityId, entityType);
      break;

    case "update_property":
      await executeUpdateProperty(step, entityId, entityType);
      break;

    case "branch":
      await executeBranch(step, entityId, entityType, workflowId);
      break;

    case "webhook":
      await executeWebhook(step, entityId, entityType);
      break;

    case "add_to_list":
      await executeAddToList(step, entityId, entityType);
      break;

    case "remove_from_list":
      await executeRemoveFromList(step, entityId, entityType);
      break;

    default:
      functions.logger.warn(`Unknown step type: ${step.type}`);
  }
}

/**
 * Execute a delay step
 */
async function executeDelay(
  step: WorkflowStep,
  entityId: string,
  entityType: string,
  workflowId: string
): Promise<void> {
  const { delayAmount, delayUnit } = step.config;

  functions.logger.info(
    `Delaying workflow ${workflowId} for ${delayAmount} ${delayUnit}`
  );

  // TODO: Implement with Cloud Tasks for production
  // For now, just log the delay
  functions.logger.info(
    `Delay of ${delayAmount} ${delayUnit} would be scheduled here`
  );

  // In production, you would schedule a Cloud Task to continue execution
  // after the delay period
}

/**
 * Execute send email step
 */
async function executeSendEmail(
  step: WorkflowStep,
  entityId: string,
  entityType: string
): Promise<void> {
  const { to, subject, body, emailSubject, emailBody } = step.config;

  // Support both old and new config formats
  const finalSubject = emailSubject || subject;
  const finalBody = emailBody || body;

  functions.logger.info(`Sending email to ${to}`, {
    subject: finalSubject,
    entityId,
    entityType,
  });

  try {
    // Send actual email via Resend
    await sendEmail({
      to,
      subject: finalSubject,
      html: finalBody,
    });

    // Create activity record for audit trail
    await db.collection("activities").add({
      type: "email",
      title: finalSubject,
      description: finalBody,
      entityId,
      entityType,
      status: "completed",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    functions.logger.info("Email sent and activity created");
  } catch (error) {
    functions.logger.error("Error sending email", error);

    // Log failed attempt
    await db.collection("activities").add({
      type: "email",
      title: finalSubject,
      description: finalBody,
      entityId,
      entityType,
      status: "failed",
      error: error instanceof Error ? error.message : String(error),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    throw error;
  }
}

/**
 * Execute send WhatsApp step
 */
async function executeSendWhatsApp(
  step: WorkflowStep,
  entityId: string,
  entityType: string
): Promise<void> {
  const { phoneNumber, message, templateId } = step.config;

  functions.logger.info(`Sending WhatsApp to ${phoneNumber}`, {
    entityId,
    entityType,
  });

  // TODO: Integrate with WhatsApp Business API
  // For now, just create an activity record
  await db.collection("activities").add({
    type: "whatsapp",
    title: "WhatsApp Message",
    description: message,
    entityId,
    entityType,
    status: "completed",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  functions.logger.info("WhatsApp activity created");
}

/**
 * Execute create task step
 */
async function executeCreateTask(
  step: WorkflowStep,
  entityId: string,
  entityType: string
): Promise<void> {
  const { title, description, dueDate, assigneeId, priority } = step.config;

  functions.logger.info(`Creating task: ${title}`, { entityId, entityType });

  await db.collection("activities").add({
    type: "task",
    title,
    description,
    entityId,
    entityType,
    dueDate: dueDate
      ? admin.firestore.Timestamp.fromDate(new Date(dueDate))
      : null,
    assigneeId: assigneeId || null,
    priority: priority || "medium",
    completed: false,
    status: "pending",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  functions.logger.info("Task created successfully");
}

/**
 * Execute update property step
 */
async function executeUpdateProperty(
  step: WorkflowStep,
  entityId: string,
  entityType: string
): Promise<void> {
  const { propertyName, propertyValue } = step.config;

  functions.logger.info(
    `Updating ${entityType} ${entityId} property: ${propertyName} = ${propertyValue}`
  );

  const collectionName = entityType === "contact" ? "contacts" : "deals";

  await db.collection(collectionName).doc(entityId).update({
    [propertyName]: propertyValue,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  functions.logger.info("Property updated successfully");
}

/**
 * Execute branch (conditional) step
 */
async function executeBranch(
  step: WorkflowStep,
  entityId: string,
  entityType: string,
  workflowId: string
): Promise<void> {
  const { conditions, yesActions, noActions } = step.config;

  functions.logger.info("Evaluating branch conditions", {
    entityId,
    entityType,
  });

  // Get entity data
  const collectionName = entityType === "contact" ? "contacts" : "deals";
  const entityDoc = await db.collection(collectionName).doc(entityId).get();

  if (!entityDoc.exists) {
    throw new Error(`${entityType} ${entityId} not found`);
  }

  const entityData = entityDoc.data()!;

  // Evaluate conditions (simple implementation)
  const conditionsMet = evaluateConditions(conditions, entityData);

  functions.logger.info(`Conditions met: ${conditionsMet}`);

  // Execute appropriate actions
  // TODO: Implement action execution for yes/no branches
}

/**
 * Execute webhook step
 */
async function executeWebhook(
  step: WorkflowStep,
  entityId: string,
  entityType: string
): Promise<void> {
  const { url, method, headers, body } = step.config;

  functions.logger.info(`Calling webhook: ${method} ${url}`, {
    entityId,
    entityType,
  });

  // TODO: Implement HTTP request to webhook URL
  functions.logger.info("Webhook would be called here");
}

/**
 * Execute add to list step
 */
async function executeAddToList(
  step: WorkflowStep,
  entityId: string,
  entityType: string
): Promise<void> {
  const { listId, listName } = step.config;

  functions.logger.info(`Adding ${entityType} ${entityId} to list ${listName}`);

  const collectionName = entityType === "contact" ? "contacts" : "deals";

  await db
    .collection(collectionName)
    .doc(entityId)
    .update({
      tags: admin.firestore.FieldValue.arrayUnion(listName),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

  functions.logger.info("Added to list successfully");
}

/**
 * Execute remove from list step
 */
async function executeRemoveFromList(
  step: WorkflowStep,
  entityId: string,
  entityType: string
): Promise<void> {
  const { listId, listName } = step.config;

  functions.logger.info(
    `Removing ${entityType} ${entityId} from list ${listName}`
  );

  const collectionName = entityType === "contact" ? "contacts" : "deals";

  await db
    .collection(collectionName)
    .doc(entityId)
    .update({
      tags: admin.firestore.FieldValue.arrayRemove(listName),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

  functions.logger.info("Removed from list successfully");
}

/**
 * Helper function to evaluate conditions
 */
function evaluateConditions(
  conditions: any[],
  entityData: Record<string, any>
): boolean {
  if (!conditions || conditions.length === 0) {
    return true;
  }

  // Simple AND evaluation of all conditions
  return conditions.every((condition) => {
    const { propertyName, operator, value } = condition;
    const actualValue = entityData[propertyName];

    switch (operator) {
      case "equals":
        return actualValue === value;
      case "not_equals":
        return actualValue !== value;
      case "contains":
        return String(actualValue).includes(String(value));
      case "greater_than":
        return actualValue > value;
      case "less_than":
        return actualValue < value;
      case "is_known":
        return actualValue !== null && actualValue !== undefined;
      case "is_unknown":
        return actualValue === null || actualValue === undefined;
      default:
        return false;
    }
  });
}
