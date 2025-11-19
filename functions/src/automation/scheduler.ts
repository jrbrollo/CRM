/**
 * Workflow Scheduler
 *
 * Handles delayed workflow execution using Cloud Tasks or scheduled functions.
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const db = admin.firestore();

/**
 * Process a delayed workflow step
 * This would typically be called from a Cloud Task after a delay period
 */
export const processDelayedStep = functions.https.onCall(
  async (data, context) => {
    // Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated"
      );
    }

    const { workflowId, stepId, entityId, entityType, enrollmentId } = data;

    if (!workflowId || !stepId || !entityId || !entityType) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Missing required parameters"
      );
    }

    functions.logger.info(
      `Processing delayed step ${stepId} for workflow ${workflowId}`
    );

    try {
      // Update enrollment status
      if (enrollmentId) {
        await db.collection("workflow_enrollments").doc(enrollmentId).update({
          status: "resuming",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      // Continue workflow execution from this step
      // TODO: Implement step continuation logic

      return { success: true, message: "Delayed step processed successfully" };
    } catch (error) {
      functions.logger.error(
        `Error processing delayed step ${stepId}:`,
        error
      );

      throw new functions.https.HttpsError(
        "internal",
        error instanceof Error ? error.message : "Unknown error occurred"
      );
    }
  }
);

/**
 * Scheduled function to check for overdue tasks
 * Runs every hour
 */
export const checkOverdueTasks = functions.pubsub
  .schedule("every 1 hours")
  .onRun(async (context) => {
    functions.logger.info("Checking for overdue tasks...");

    try {
      const now = admin.firestore.Timestamp.now();

      // Find overdue tasks
      const overdueTasksSnapshot = await db
        .collection("activities")
        .where("type", "==", "task")
        .where("completed", "==", false)
        .where("dueDate", "<", now)
        .get();

      functions.logger.info(
        `Found ${overdueTasksSnapshot.size} overdue tasks`
      );

      // Send notifications for overdue tasks
      const promises = overdueTasksSnapshot.docs.map(async (taskDoc) => {
        const task = taskDoc.data();

        // Create notification
        await db.collection("notifications").add({
          type: "overdue_task",
          userId: task.assigneeId,
          taskId: taskDoc.id,
          taskTitle: task.title,
          dueDate: task.dueDate,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          read: false,
        });

        // TODO: Send email/push notification
        functions.logger.info(
          `Created notification for overdue task: ${task.title}`
        );
      });

      await Promise.all(promises);

      return null;
    } catch (error) {
      functions.logger.error("Error checking overdue tasks:", error);
      throw error;
    }
  });

/**
 * Scheduled function to clean up old workflow enrollments
 * Runs daily at midnight
 */
export const cleanupOldEnrollments = functions.pubsub
  .schedule("every day 00:00")
  .timeZone("America/Sao_Paulo")
  .onRun(async (context) => {
    functions.logger.info("Cleaning up old workflow enrollments...");

    try {
      // Delete enrollments older than 90 days
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 90);

      const oldEnrollmentsSnapshot = await db
        .collection("workflow_enrollments")
        .where("completedAt", "<", admin.firestore.Timestamp.fromDate(cutoffDate))
        .limit(500) // Process in batches
        .get();

      functions.logger.info(
        `Found ${oldEnrollmentsSnapshot.size} old enrollments to delete`
      );

      // Delete in batch
      const batch = db.batch();
      oldEnrollmentsSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      functions.logger.info(
        `Deleted ${oldEnrollmentsSnapshot.size} old enrollments`
      );

      return null;
    } catch (error) {
      functions.logger.error("Error cleaning up old enrollments:", error);
      throw error;
    }
  });
