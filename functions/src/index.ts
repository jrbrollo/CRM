/**
 * Cloud Functions for CRM Workflow Automation
 *
 * This file is the entry point for all Firebase Cloud Functions.
 * Functions are triggered by Firestore events, HTTP requests, or scheduled tasks.
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Initialize Firebase Admin
admin.initializeApp();

// Export automation triggers
export { onContactCreated, onContactUpdated } from "./automation/triggers";
export { onDealStageChange } from "./automation/triggers";
export { onWorkflowEnrollment } from "./automation/triggers";

// Export workflow execution (legacy)
export { executeWorkflowStep } from "./automation/workflowEngine";
export { processDelayedStep } from "./automation/scheduler";

// Export new enterprise workflow engine
export { workflowExecutionEngine } from "./engine/workflowEngine";
export {
  workflowScheduler,
  resumeDelayedWorkflows,
  workflowDealWatcher,
} from "./engine/workflowScheduler";

// Export API endpoints
export { enrollContactInWorkflow } from "./api/webhooks";
export { updateLeadScore } from "./api/webhooks";

// Health check endpoint
export const healthCheck = functions.https.onRequest(
  async (req, res) => {
    res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      service: "CRM Workflow Automation",
    });
  }
);

// Log function for debugging
functions.logger.info("CRM Workflow Functions initialized");
