/**
 * Workflow Execution Engine
 *
 * Core engine for executing workflows and their actions
 */

import { Timestamp, serverTimestamp } from 'firebase/firestore';
import type {
  Workflow,
  WorkflowAction,
  WorkflowCondition,
  WorkflowExecution,
  WorkflowExecutionLog,
} from '../types/workflow.types';
import type { Deal } from '../types/deal.types';
import type { Task } from '../types/task.types';

// Services
import { createTask } from './taskService';
import { updateDeal as updateDealService } from './dealService';
import { createNotification, sendBulkNotifications } from './notificationService';
import { getNextPlannerRoundRobin, incrementSLAViolations } from './teamService';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';

// ============================================================================
// CONTEXT INTERFACES
// ============================================================================

export interface WorkflowExecutionContext {
  deal?: Deal;
  task?: Task;
  userId?: string;
  triggerData?: Record<string, any>;
}

// ============================================================================
// CONDITION EVALUATOR
// ============================================================================

export function evaluateCondition(
  condition: WorkflowCondition,
  context: WorkflowExecutionContext
): boolean {
  const { field, operator, value } = condition;

  // Get field value from context
  const fieldValue = getFieldValue(field, context);

  switch (operator) {
    case 'equals':
      return fieldValue === value;

    case 'not_equals':
      return fieldValue !== value;

    case 'contains':
      return (
        typeof fieldValue === 'string' &&
        fieldValue.includes(value)
      );

    case 'not_contains':
      return (
        typeof fieldValue === 'string' &&
        !fieldValue.includes(value)
      );

    case 'greater_than':
      return Number(fieldValue) > Number(value);

    case 'less_than':
      return Number(fieldValue) < Number(value);

    case 'greater_than_or_equal':
      return Number(fieldValue) >= Number(value);

    case 'less_than_or_equal':
      return Number(fieldValue) <= Number(value);

    case 'in':
      return Array.isArray(value) && value.includes(fieldValue);

    case 'not_in':
      return Array.isArray(value) && !value.includes(fieldValue);

    case 'is_empty':
      return !fieldValue || fieldValue === '' || (Array.isArray(fieldValue) && fieldValue.length === 0);

    case 'is_not_empty':
      return !!fieldValue && fieldValue !== '' && (!Array.isArray(fieldValue) || fieldValue.length > 0);

    default:
      return false;
  }
}

export function evaluateAllConditions(
  conditions: WorkflowCondition[] | undefined,
  context: WorkflowExecutionContext
): boolean {
  if (!conditions || conditions.length === 0) {
    return true; // No conditions = always true
  }

  return conditions.every((condition) => evaluateCondition(condition, context));
}

function getFieldValue(
  field: string,
  context: WorkflowExecutionContext
): any {
  // Support dot notation: deal.sourceId, task.status, etc
  const parts = field.split('.');

  if (parts[0] === 'deal' && context.deal) {
    return getNestedValue(context.deal, parts.slice(1));
  }

  if (parts[0] === 'task' && context.task) {
    return getNestedValue(context.task, parts.slice(1));
  }

  if (parts[0] === 'user' && context.userId) {
    return context.userId;
  }

  // Direct field access
  if (context.deal) {
    return getNestedValue(context.deal, parts);
  }

  return undefined;
}

function getNestedValue(obj: any, path: string[]): any {
  return path.reduce((current, key) => current?.[key], obj);
}

// ============================================================================
// ACTION EXECUTORS
// ============================================================================

async function executeCreateTask(
  action: WorkflowAction,
  context: WorkflowExecutionContext,
  workflowId: string
): Promise<string> {
  const config = action.config;

  if (!config.taskTitle) {
    throw new Error('Task title is required');
  }

  // Calculate due date
  let dueDate: Date | undefined;
  if (config.taskDueInMinutes) {
    dueDate = new Date(Date.now() + config.taskDueInMinutes * 60 * 1000);
  } else if (config.taskDueInHours) {
    dueDate = new Date(Date.now() + config.taskDueInHours * 60 * 60 * 1000);
  } else if (config.taskDueInDays) {
    dueDate = new Date(Date.now() + config.taskDueInDays * 24 * 60 * 60 * 1000);
  }

  // Determine assignee
  let assignedTo: string;

  if (config.taskAssignTo === 'deal_owner' && context.deal) {
    assignedTo = context.deal.ownerId;
  } else if (config.taskAssignTo === 'specific_user' && config.taskAssignToUserId) {
    assignedTo = config.taskAssignToUserId;
  } else if (config.taskAssignTo === 'round_robin' && context.deal) {
    // TODO: Get team from deal owner and round-robin
    const nextPlanner = await getNextPlannerRoundRobin('default-team');
    if (!nextPlanner) {
      throw new Error('No available planners for round-robin');
    }
    assignedTo = nextPlanner;
  } else {
    assignedTo = context.userId || context.deal?.ownerId || '';
  }

  const taskId = await createTask({
    title: config.taskTitle,
    description: config.taskDescription,
    type: config.taskType || 'other',
    priority: config.taskPriority || 'medium',
    assignedTo,
    createdBy: context.userId || 'workflow',
    dealId: context.deal?.id,
    workflowId,
    dueDate,
    tags: config.taskTags,
  });

  return `Task created: ${taskId}`;
}

async function executeUpdateDeal(
  action: WorkflowAction,
  context: WorkflowExecutionContext
): Promise<string> {
  if (!context.deal) {
    throw new Error('No deal in context');
  }

  const config = action.config;
  const updates: Record<string, any> = { ...config.dealUpdates };

  if (config.incrementContactAttempts) {
    updates.contactAttempts = (context.deal.contactAttempts || 0) + 1;
    updates.lastContactAttemptAt = serverTimestamp();
  }

  if (config.updateLastActivityAt) {
    updates.lastActivityAt = serverTimestamp();
  }

  if (config.setClientStatus) {
    updates.clientStatus = config.setClientStatus;
  }

  if (config.setSlaViolation) {
    updates.slaViolations = (context.deal.slaViolations || 0) + 1;
    updates.lastSlaViolationAt = serverTimestamp();
  }

  await updateDealService(context.deal.id, updates);

  return `Deal updated: ${context.deal.id}`;
}

async function executeAssignDeal(
  action: WorkflowAction,
  context: WorkflowExecutionContext
): Promise<string> {
  if (!context.deal) {
    throw new Error('No deal in context');
  }

  const config = action.config;
  let newOwnerId: string;

  if (config.assignTo === 'specific_user' && config.assignToUserId) {
    newOwnerId = config.assignToUserId;
  } else if (config.assignTo === 'round_robin') {
    const teamId = config.assignToTeamId || 'default-team';
    const nextPlanner = await getNextPlannerRoundRobin(teamId);
    if (!nextPlanner) {
      throw new Error('No available planners');
    }
    newOwnerId = nextPlanner;
  } else {
    throw new Error('Invalid assignment configuration');
  }

  await updateDealService(context.deal.id, {
    ownerId: newOwnerId,
    lastActivityAt: serverTimestamp(),
  });

  return `Deal assigned to: ${newOwnerId}`;
}

async function executeSendNotification(
  action: WorkflowAction,
  context: WorkflowExecutionContext,
  workflowId: string
): Promise<string> {
  const config = action.config;

  if (!config.notificationTitle || !config.notificationMessage) {
    throw new Error('Notification title and message are required');
  }

  const recipientIds: string[] = [];

  if (config.notifyUsers) {
    for (const userType of config.notifyUsers) {
      if (userType === 'deal_owner' && context.deal) {
        recipientIds.push(context.deal.ownerId);
      } else if (userType === 'specific_user' && config.notifyUserIds) {
        recipientIds.push(...config.notifyUserIds);
      }
      // TODO: Implement team_leader and all_team
    }
  }

  if (recipientIds.length === 0 && context.userId) {
    recipientIds.push(context.userId);
  }

  await sendBulkNotifications(recipientIds, {
    type: 'workflow_executed',
    title: config.notificationTitle,
    message: config.notificationMessage,
    priority: config.notificationPriority || 'medium',
    dealId: context.deal?.id,
    workflowId,
  });

  return `Notification sent to ${recipientIds.length} users`;
}

async function executeIncrementCounter(
  action: WorkflowAction,
  context: WorkflowExecutionContext
): Promise<string> {
  if (!context.deal) {
    throw new Error('No deal in context');
  }

  const config = action.config;
  const field = config.counterField;
  const incrementBy = config.incrementBy || 1;

  if (!field) {
    throw new Error('Counter field is required');
  }

  const currentValue = (context.deal as any)[field] || 0;
  const updates: Record<string, any> = {
    [field]: currentValue + incrementBy,
  };

  await updateDealService(context.deal.id, updates);

  return `Incremented ${field} by ${incrementBy}`;
}

async function executeSetProperty(
  action: WorkflowAction,
  context: WorkflowExecutionContext
): Promise<string> {
  if (!context.deal) {
    throw new Error('No deal in context');
  }

  const config = action.config;

  if (!config.propertyField) {
    throw new Error('Property field is required');
  }

  const updates: Record<string, any> = {
    [config.propertyField]: config.propertyValue,
  };

  await updateDealService(context.deal.id, updates);

  return `Set ${config.propertyField} to ${config.propertyValue}`;
}

async function executeTrackSLAViolation(
  action: WorkflowAction,
  context: WorkflowExecutionContext
): Promise<string> {
  if (!context.deal) {
    throw new Error('No deal in context');
  }

  // Increment SLA violations on deal
  await updateDealService(context.deal.id, {
    slaViolations: (context.deal.slaViolations || 0) + 1,
    lastSlaViolationAt: serverTimestamp(),
  });

  // Increment on planner profile
  if (context.deal.ownerId) {
    await incrementSLAViolations(context.deal.ownerId);
  }

  return 'SLA violation tracked';
}

// Main action executor
async function executeAction(
  action: WorkflowAction,
  context: WorkflowExecutionContext,
  workflowId: string
): Promise<string> {
  // Check action-specific conditions
  if (action.conditions && !evaluateAllConditions(action.conditions, context)) {
    return 'Skipped (conditions not met)';
  }

  // Apply delay if specified
  if (action.delay && action.delay > 0) {
    // In production, this would schedule the action for later
    // For now, we'll just note it in the log
    return `Scheduled for ${action.delay} minutes from now`;
  }

  switch (action.type) {
    case 'create_task':
      return await executeCreateTask(action, context, workflowId);

    case 'update_deal':
      return await executeUpdateDeal(action, context);

    case 'assign_deal':
    case 'assign_round_robin':
      return await executeAssignDeal(action, context);

    case 'send_notification':
      return await executeSendNotification(action, context, workflowId);

    case 'increment_counter':
      return await executeIncrementCounter(action, context);

    case 'set_property':
      return await executeSetProperty(action, context);

    case 'track_sla_violation':
      return await executeTrackSLAViolation(action, context);

    case 'send_email':
      // TODO: Implement email integration
      return 'Email feature not yet implemented';

    case 'send_whatsapp':
      // TODO: Implement WhatsApp integration
      return 'WhatsApp feature not yet implemented';

    case 'webhook':
      // TODO: Implement webhook calls
      return 'Webhook feature not yet implemented';

    case 'create_calendar_event':
      // TODO: Implement calendar integration
      return 'Calendar feature not yet implemented';

    case 'create_deal':
    case 'move_deal_stage':
    case 'mark_deal_won':
    case 'mark_deal_lost':
    case 'update_task':
    case 'complete_task':
    case 'assign_by_criteria':
    case 'reassign_deals':
    case 'log_activity':
    case 'wait':
    case 'conditional':
    case 'stop_workflow':
      return `Action ${action.type} not yet implemented`;

    default:
      return `Unknown action type: ${action.type}`;
  }
}

// ============================================================================
// MAIN EXECUTION FUNCTION
// ============================================================================

export async function executeWorkflow(
  workflow: Workflow,
  context: WorkflowExecutionContext
): Promise<WorkflowExecution> {
  const execution: WorkflowExecution = {
    id: '', // Will be set after saving
    workflowId: workflow.id,
    workflowName: workflow.name,
    dealId: context.deal?.id,
    taskId: context.task?.id,
    userId: context.userId,
    status: 'running',
    startedAt: Timestamp.now(),
    actionsExecuted: 0,
    actionsFailed: 0,
    errors: [],
    logs: [],
  };

  try {
    // Check workflow conditions
    if (!evaluateAllConditions(workflow.conditions, context)) {
      execution.status = 'completed';
      execution.logs.push({
        timestamp: Timestamp.now(),
        action: 'conditional' as any,
        status: 'success',
        message: 'Workflow conditions not met, skipping execution',
      });
      execution.completedAt = Timestamp.now();
      return execution;
    }

    // Execute actions sequentially
    for (const action of workflow.actions) {
      try {
        const result = await executeAction(action, context, workflow.id);

        execution.logs.push({
          timestamp: Timestamp.now(),
          action: action.type,
          status: 'success',
          message: result,
        });

        execution.actionsExecuted++;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';

        execution.logs.push({
          timestamp: Timestamp.now(),
          action: action.type,
          status: 'failed',
          message: 'Action failed',
          error: errorMessage,
        });

        execution.actionsFailed++;
        execution.errors?.push(errorMessage);
      }
    }

    // Determine final status
    if (execution.actionsFailed === 0) {
      execution.status = 'completed';
    } else if (execution.actionsExecuted > 0) {
      execution.status = 'partial';
    } else {
      execution.status = 'failed';
    }

    execution.completedAt = Timestamp.now();
  } catch (error) {
    execution.status = 'failed';
    execution.completedAt = Timestamp.now();
    execution.errors?.push(
      error instanceof Error ? error.message : 'Workflow execution failed'
    );
  }

  // Save execution log
  const docRef = await addDoc(collection(db, 'workflowExecutions'), execution);
  execution.id = docRef.id;

  return execution;
}

// ============================================================================
// TRIGGER DETECTION
// ============================================================================

export async function handleDealStageChanged(
  deal: Deal,
  fromStageId: string,
  toStageId: string,
  workflows: Workflow[]
): Promise<void> {
  const matchingWorkflows = workflows.filter((wf) => {
    if (!wf.isActive) return false;
    if (wf.trigger.type !== 'deal_stage_changed') return false;

    const config = wf.trigger.config;

    // Check pipeline match
    if (config.pipelineId && config.pipelineId !== deal.pipelineId) {
      return false;
    }

    // Check stage match
    if (config.toStageId && config.toStageId !== toStageId) {
      return false;
    }

    return true;
  });

  // Execute matching workflows
  for (const workflow of matchingWorkflows) {
    await executeWorkflow(workflow, {
      deal,
      triggerData: { fromStageId, toStageId },
    });
  }
}

export async function handleDealCreated(
  deal: Deal,
  workflows: Workflow[]
): Promise<void> {
  const matchingWorkflows = workflows.filter(
    (wf) => wf.isActive && wf.trigger.type === 'deal_created'
  );

  for (const workflow of matchingWorkflows) {
    await executeWorkflow(workflow, { deal });
  }
}

export async function handleDealWon(
  deal: Deal,
  workflows: Workflow[]
): Promise<void> {
  const matchingWorkflows = workflows.filter(
    (wf) => wf.isActive && wf.trigger.type === 'deal_won'
  );

  for (const workflow of matchingWorkflows) {
    await executeWorkflow(workflow, { deal });
  }
}

export async function handleDealLost(
  deal: Deal,
  workflows: Workflow[]
): Promise<void> {
  const matchingWorkflows = workflows.filter(
    (wf) => wf.isActive && wf.trigger.type === 'deal_lost'
  );

  for (const workflow of matchingWorkflows) {
    await executeWorkflow(workflow, { deal });
  }
}
