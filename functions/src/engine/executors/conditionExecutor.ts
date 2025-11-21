/**
 * Condition Executor - Evaluates workflow condition nodes
 *
 * Handles IF/ELSE logic with multiple operators and field comparisons
 */

import * as functions from 'firebase-functions';

interface ConditionNodeExecutionResult {
  success: boolean;
  nextNodeId?: string;
  error?: string;
  context?: Record<string, any>;
}

/**
 * Evaluate Condition Node - Determines which path to take (true/false)
 */
export async function evaluateConditionNode(
  node: any,
  targetData: any,
  context: Record<string, any>
): Promise<ConditionNodeExecutionResult> {
  functions.logger.info(`Evaluating condition node: ${node.id}`);

  try {
    const { conditions, operator } = node.config || {};

    if (!conditions || conditions.length === 0) {
      throw new Error('Condition node has no conditions defined');
    }

    // Evaluate conditions based on operator (AND/OR)
    const conditionResults = conditions.map((condition: any) =>
      evaluateSingleCondition(condition, targetData, context)
    );

    let finalResult: boolean;

    if (operator === 'or') {
      // OR: at least one condition must be true
      finalResult = conditionResults.some(result => result === true);
    } else {
      // AND (default): all conditions must be true
      finalResult = conditionResults.every(result => result === true);
    }

    functions.logger.info(
      `Condition evaluated to: ${finalResult} (operator: ${operator || 'and'})`
    );

    // Return the appropriate next node based on the result
    const nextNodeId = finalResult ? node.trueNextId : node.falseNextId;

    if (!nextNodeId) {
      throw new Error(
        `Condition node missing ${finalResult ? 'trueNextId' : 'falseNextId'}`
      );
    }

    return {
      success: true,
      nextNodeId,
      context: {
        ...context,
        lastConditionResult: finalResult,
        lastConditionNodeId: node.id,
      },
    };
  } catch (error) {
    functions.logger.error(`Error evaluating condition:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Evaluate a single condition
 */
function evaluateSingleCondition(
  condition: any,
  targetData: any,
  context: Record<string, any>
): boolean {
  const { field, operator, value } = condition;

  if (!field || !operator) {
    functions.logger.warn('Invalid condition: missing field or operator');
    return false;
  }

  // Get the actual field value from targetData or context
  const actualValue = getFieldValue(field, targetData, context);

  functions.logger.info(
    `Evaluating: ${field} (${actualValue}) ${operator} ${value}`
  );

  // Evaluate based on operator
  switch (operator) {
    case 'equals':
    case '==':
    case '===':
      return compareValues(actualValue, value) === 0;

    case 'not_equals':
    case '!=':
    case '!==':
      return compareValues(actualValue, value) !== 0;

    case 'greater_than':
    case '>':
      return compareValues(actualValue, value) > 0;

    case 'greater_or_equal':
    case '>=':
      return compareValues(actualValue, value) >= 0;

    case 'less_than':
    case '<':
      return compareValues(actualValue, value) < 0;

    case 'less_or_equal':
    case '<=':
      return compareValues(actualValue, value) <= 0;

    case 'contains':
      return String(actualValue || '')
        .toLowerCase()
        .includes(String(value || '').toLowerCase());

    case 'not_contains':
      return !String(actualValue || '')
        .toLowerCase()
        .includes(String(value || '').toLowerCase());

    case 'starts_with':
      return String(actualValue || '')
        .toLowerCase()
        .startsWith(String(value || '').toLowerCase());

    case 'ends_with':
      return String(actualValue || '')
        .toLowerCase()
        .endsWith(String(value || '').toLowerCase());

    case 'is_empty':
    case 'is_null':
      return (
        actualValue === null ||
        actualValue === undefined ||
        actualValue === '' ||
        (Array.isArray(actualValue) && actualValue.length === 0)
      );

    case 'is_not_empty':
    case 'is_not_null':
      return (
        actualValue !== null &&
        actualValue !== undefined &&
        actualValue !== '' &&
        !(Array.isArray(actualValue) && actualValue.length === 0)
      );

    case 'in':
      if (!Array.isArray(value)) {
        functions.logger.warn('IN operator requires array value');
        return false;
      }
      return value.some(v => compareValues(actualValue, v) === 0);

    case 'not_in':
      if (!Array.isArray(value)) {
        functions.logger.warn('NOT IN operator requires array value');
        return false;
      }
      return !value.some(v => compareValues(actualValue, v) === 0);

    case 'matches_regex':
      try {
        const regex = new RegExp(value);
        return regex.test(String(actualValue || ''));
      } catch (error) {
        functions.logger.error('Invalid regex pattern:', value);
        return false;
      }

    default:
      functions.logger.warn(`Unknown operator: ${operator}`);
      return false;
  }
}

/**
 * Get field value from targetData or context
 * Supports dot notation: "deal.status", "contact.email", "context.counter"
 */
function getFieldValue(
  field: string,
  targetData: any,
  context: Record<string, any>
): any {
  // Handle dot notation
  const parts = field.split('.');

  if (parts[0] === 'context') {
    // Context variable
    let value = context;
    for (let i = 1; i < parts.length; i++) {
      value = value?.[parts[i]];
    }
    return value;
  }

  if (parts[0] === targetData.type) {
    // Target data field (e.g., "deal.status")
    let value = targetData;
    for (let i = 1; i < parts.length; i++) {
      value = value?.[parts[i]];
    }
    return value;
  }

  // Direct field access from targetData
  let value = targetData;
  for (const part of parts) {
    value = value?.[part];
  }

  // Fallback to context if not found in targetData
  if (value === undefined && context[field] !== undefined) {
    return context[field];
  }

  return value;
}

/**
 * Compare two values with type coercion
 * Returns: -1 (less than), 0 (equal), 1 (greater than)
 */
function compareValues(a: any, b: any): number {
  // Handle null/undefined
  if (a === null || a === undefined) {
    return b === null || b === undefined ? 0 : -1;
  }
  if (b === null || b === undefined) {
    return 1;
  }

  // Handle numbers
  const numA = Number(a);
  const numB = Number(b);
  if (!isNaN(numA) && !isNaN(numB)) {
    if (numA < numB) return -1;
    if (numA > numB) return 1;
    return 0;
  }

  // Handle dates (Firestore Timestamp or Date objects)
  if (a.toDate && typeof a.toDate === 'function') {
    a = a.toDate();
  }
  if (b.toDate && typeof b.toDate === 'function') {
    b = b.toDate();
  }

  if (a instanceof Date && b instanceof Date) {
    const timeA = a.getTime();
    const timeB = b.getTime();
    if (timeA < timeB) return -1;
    if (timeA > timeB) return 1;
    return 0;
  }

  // Handle booleans
  if (typeof a === 'boolean' && typeof b === 'boolean') {
    if (a === b) return 0;
    return a ? 1 : -1;
  }

  // Handle strings (case-insensitive)
  const strA = String(a).toLowerCase();
  const strB = String(b).toLowerCase();

  if (strA < strB) return -1;
  if (strA > strB) return 1;
  return 0;
}

/**
 * Helper: Evaluate a complex condition expression
 * This allows for more advanced conditions like "(field1 > 100 AND field2 == 'active') OR field3 is_not_empty"
 * For now, we use the simpler array-based conditions with AND/OR operator at the node level
 */
export function evaluateComplexCondition(
  expression: string,
  targetData: any,
  context: Record<string, any>
): boolean {
  // TODO: Implement expression parser if needed for advanced use cases
  // For now, use the array-based conditions approach
  functions.logger.warn('Complex condition expressions not yet implemented');
  return false;
}
