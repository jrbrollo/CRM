/**
 * Action Executor - Executes workflow action nodes
 *
 * Handles all action types: email, task creation, deal updates, assignments, etc.
 */

import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { sendEmail } from '../../services/emailService';

const db = admin.firestore();

interface ActionNodeExecutionResult {
  success: boolean;
  nextNodeId?: string;
  error?: string;
  context?: Record<string, any>;
}

/**
 * Execute Action Node - Main dispatcher
 */
export async function executeActionNode(
  node: any,
  targetData: any,
  context: Record<string, any>
): Promise<ActionNodeExecutionResult> {
  functions.logger.info(`Executing action node: ${node.id} (action: ${node.action})`);

  try {
    switch (node.action) {
      case 'send_email':
        return await executeSendEmail(node, targetData, context);

      case 'create_task':
        return await executeCreateTask(node, targetData, context);

      case 'update_deal':
        return await executeUpdateDeal(node, targetData, context);

      case 'assign_deal':
        return await executeAssignDeal(node, targetData, context);

      case 'move_to_stage':
        return await executeMoveToStage(node, targetData, context);

      case 'create_activity':
        return await executeCreateActivity(node, targetData, context);

      case 'webhook':
        return await executeWebhook(node, targetData, context);

      default:
        throw new Error(`Unknown action type: ${node.action}`);
    }
  } catch (error) {
    functions.logger.error(`Error executing action ${node.action}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Send Email Action
 */
async function executeSendEmail(
  node: any,
  targetData: any,
  context: Record<string, any>
): Promise<ActionNodeExecutionResult> {
  const { emailTo, emailSubject, emailBody, emailTemplate } = node.config || {};

  // Replace variables in subject and body
  const finalSubject = replaceVariables(emailSubject || '', targetData, context);
  const finalBody = replaceVariables(emailBody || '', targetData, context);
  const finalTo = replaceVariables(emailTo || targetData.email || '', targetData, context);

  if (!finalTo) {
    throw new Error('Email recipient not specified');
  }

  functions.logger.info(`Sending email to ${finalTo}`);

  try {
    await sendEmail({
      to: [finalTo],
      subject: finalSubject,
      html: finalBody,
    });

    // Log activity
    await logActivity({
      type: 'email',
      description: `Email sent: ${finalSubject}`,
      targetType: targetData.type || 'deal',
      targetId: targetData.id,
      status: 'completed',
      metadata: {
        to: finalTo,
        subject: finalSubject,
      },
    });

    return {
      success: true,
      context: {
        ...context,
        lastEmailSentAt: admin.firestore.Timestamp.now(),
        lastEmailTo: finalTo,
      },
    };
  } catch (error) {
    // Log failed activity
    await logActivity({
      type: 'email',
      description: `Failed to send email: ${finalSubject}`,
      targetType: targetData.type || 'deal',
      targetId: targetData.id,
      status: 'failed',
      metadata: {
        error: error instanceof Error ? error.message : String(error),
      },
    });

    throw error;
  }
}

/**
 * Create Task Action
 */
async function executeCreateTask(
  node: any,
  targetData: any,
  context: Record<string, any>
): Promise<ActionNodeExecutionResult> {
  const { taskTitle, taskDescription, taskAssignee, taskDueDate } = node.config || {};

  const title = replaceVariables(taskTitle || '', targetData, context);
  const description = replaceVariables(taskDescription || '', targetData, context);

  // Calculate due date
  let dueDate = null;
  if (taskDueDate) {
    const daysFromNow = parseInt(taskDueDate, 10);
    if (!isNaN(daysFromNow)) {
      const date = new Date();
      date.setDate(date.getDate() + daysFromNow);
      dueDate = admin.firestore.Timestamp.fromDate(date);
    }
  }

  const taskData = {
    title,
    description,
    status: 'pending',
    assigneeId: taskAssignee || null,
    dealId: targetData.type === 'deal' ? targetData.id : null,
    contactId: targetData.type === 'contact' ? targetData.id : null,
    dueDate,
    createdAt: admin.firestore.Timestamp.now(),
    createdBy: 'workflow',
  };

  const taskRef = await db.collection('tasks').add(taskData);

  functions.logger.info(`Created task ${taskRef.id}: ${title}`);

  await logActivity({
    type: 'task_created',
    description: `Task created: ${title}`,
    targetType: targetData.type || 'deal',
    targetId: targetData.id,
    status: 'completed',
    metadata: {
      taskId: taskRef.id,
      taskTitle: title,
    },
  });

  return {
    success: true,
    context: {
      ...context,
      lastCreatedTaskId: taskRef.id,
      lastCreatedTaskTitle: title,
    },
  };
}

/**
 * Update Deal Action
 */
async function executeUpdateDeal(
  node: any,
  targetData: any,
  context: Record<string, any>
): Promise<ActionNodeExecutionResult> {
  if (targetData.type !== 'deal' && !node.config?.dealId) {
    throw new Error('Update deal action requires a deal target');
  }

  const dealId = node.config?.dealId || targetData.id;
  const updates: Record<string, any> = {};

  // Build updates object from config
  const { dealValue, dealStatus, dealTags, customFields } = node.config || {};

  if (dealValue !== undefined) {
    updates.value = parseFloat(dealValue);
  }

  if (dealStatus) {
    updates.status = dealStatus;
  }

  if (dealTags) {
    updates.tags = Array.isArray(dealTags) ? dealTags : [dealTags];
  }

  if (customFields) {
    updates.customFields = customFields;
  }

  updates.updatedAt = admin.firestore.Timestamp.now();

  await db.collection('deals').doc(dealId).update(updates);

  functions.logger.info(`Updated deal ${dealId}:`, updates);

  await logActivity({
    type: 'deal_updated',
    description: `Deal updated by workflow`,
    targetType: 'deal',
    targetId: dealId,
    status: 'completed',
    metadata: updates,
  });

  return {
    success: true,
    context: {
      ...context,
      dealUpdated: true,
      dealUpdates: updates,
    },
  };
}

/**
 * Assign Deal Action
 */
async function executeAssignDeal(
  node: any,
  targetData: any,
  context: Record<string, any>
): Promise<ActionNodeExecutionResult> {
  if (targetData.type !== 'deal') {
    throw new Error('Assign deal action requires a deal target');
  }

  const { assigneeId, teamId } = node.config || {};

  if (!assigneeId && !teamId) {
    throw new Error('Assign deal requires assigneeId or teamId');
  }

  const updates: Record<string, any> = {
    updatedAt: admin.firestore.Timestamp.now(),
  };

  if (assigneeId) {
    updates.assigneeId = assigneeId;
  }

  if (teamId) {
    updates.teamId = teamId;
  }

  await db.collection('deals').doc(targetData.id).update(updates);

  functions.logger.info(`Assigned deal ${targetData.id} to user/team`);

  await logActivity({
    type: 'deal_assigned',
    description: `Deal assigned by workflow`,
    targetType: 'deal',
    targetId: targetData.id,
    status: 'completed',
    metadata: {
      assigneeId,
      teamId,
    },
  });

  return {
    success: true,
    context: {
      ...context,
      dealAssigned: true,
      assigneeId,
      teamId,
    },
  };
}

/**
 * Move to Stage Action
 */
async function executeMoveToStage(
  node: any,
  targetData: any,
  context: Record<string, any>
): Promise<ActionNodeExecutionResult> {
  if (targetData.type !== 'deal') {
    throw new Error('Move to stage action requires a deal target');
  }

  const { stageId, pipelineId } = node.config || {};

  if (!stageId) {
    throw new Error('Move to stage requires stageId');
  }

  const updates: Record<string, any> = {
    stageId,
    updatedAt: admin.firestore.Timestamp.now(),
  };

  if (pipelineId) {
    updates.pipelineId = pipelineId;
  }

  await db.collection('deals').doc(targetData.id).update(updates);

  functions.logger.info(`Moved deal ${targetData.id} to stage ${stageId}`);

  await logActivity({
    type: 'stage_changed',
    description: `Deal moved to new stage by workflow`,
    targetType: 'deal',
    targetId: targetData.id,
    status: 'completed',
    metadata: {
      stageId,
      pipelineId,
    },
  });

  return {
    success: true,
    context: {
      ...context,
      currentStageId: stageId,
      stageMoved: true,
    },
  };
}

/**
 * Create Activity Action
 */
async function executeCreateActivity(
  node: any,
  targetData: any,
  context: Record<string, any>
): Promise<ActionNodeExecutionResult> {
  const { activityType, activityDescription, activityMetadata } = node.config || {};

  const description = replaceVariables(activityDescription || '', targetData, context);

  await logActivity({
    type: activityType || 'custom',
    description,
    targetType: targetData.type || 'deal',
    targetId: targetData.id,
    status: 'completed',
    metadata: activityMetadata || {},
  });

  return {
    success: true,
    context: {
      ...context,
      lastActivity: activityType,
    },
  };
}

/**
 * Webhook Action
 */
async function executeWebhook(
  node: any,
  targetData: any,
  context: Record<string, any>
): Promise<ActionNodeExecutionResult> {
  const { webhookUrl, webhookMethod, webhookHeaders, webhookBody } = node.config || {};

  if (!webhookUrl) {
    throw new Error('Webhook action requires webhookUrl');
  }

  const method = webhookMethod || 'POST';
  const headers = {
    'Content-Type': 'application/json',
    ...(webhookHeaders || {}),
  };

  // Prepare body with variable replacement
  let body = webhookBody || {};
  if (typeof body === 'string') {
    body = replaceVariables(body, targetData, context);
  } else {
    body = JSON.parse(replaceVariables(JSON.stringify(body), targetData, context));
  }

  functions.logger.info(`Calling webhook: ${method} ${webhookUrl}`);

  const response = await fetch(webhookUrl, {
    method,
    headers,
    body: method !== 'GET' ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
  }

  const responseData = await response.json().catch(() => ({}));

  await logActivity({
    type: 'webhook',
    description: `Webhook called: ${webhookUrl}`,
    targetType: targetData.type || 'deal',
    targetId: targetData.id,
    status: 'completed',
    metadata: {
      url: webhookUrl,
      method,
      statusCode: response.status,
    },
  });

  return {
    success: true,
    context: {
      ...context,
      webhookResponse: responseData,
      webhookStatusCode: response.status,
    },
  };
}

/**
 * Helper: Replace variables in text
 */
function replaceVariables(
  text: string,
  targetData: any,
  context: Record<string, any>
): string {
  let result = text;

  // Replace {{deal.field}} or {{contact.field}}
  result = result.replace(/\{\{(\w+)\.(\w+)\}\}/g, (match, entity, field) => {
    if (entity === targetData.type) {
      return targetData[field] || match;
    }
    return match;
  });

  // Replace {{context.field}}
  result = result.replace(/\{\{context\.(\w+)\}\}/g, (match, field) => {
    return context[field] || match;
  });

  // Replace {{field}} with targetData.field
  result = result.replace(/\{\{(\w+)\}\}/g, (match, field) => {
    return targetData[field] || context[field] || match;
  });

  return result;
}

/**
 * Helper: Log activity to Firestore
 */
async function logActivity(data: {
  type: string;
  description: string;
  targetType: string;
  targetId: string;
  status: string;
  metadata?: Record<string, any>;
}): Promise<void> {
  await db.collection('activities').add({
    ...data,
    createdAt: admin.firestore.Timestamp.now(),
    source: 'workflow',
  });
}
