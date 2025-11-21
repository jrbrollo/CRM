/**
 * Workflow Scheduler - The Watcher
 *
 * Runs periodically to resume workflows that have completed their delay
 * Queries for enrollments with status='waiting' and nextExecutionAt <= now
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

/**
 * Scheduled function that runs every minute to resume delayed workflows
 *
 * Usage:
 * - Deployed automatically with Firebase Functions
 * - Runs every 1 minute via Cloud Scheduler
 * - Reactivates enrollments that have waited long enough
 */
export const workflowScheduler = functions.pubsub
  .schedule('every 1 minutes')
  .onRun(async (context) => {
    functions.logger.info('Workflow scheduler started');

    const now = admin.firestore.Timestamp.now();

    try {
      // Query for enrollments that are waiting and ready to resume
      const waitingEnrollments = await db
        .collection('workflowEnrollments')
        .where('status', '==', 'waiting')
        .where('nextExecutionAt', '<=', now)
        .limit(100) // Process up to 100 at a time
        .get();

      if (waitingEnrollments.empty) {
        functions.logger.info('No enrollments ready to resume');
        return null;
      }

      functions.logger.info(
        `Found ${waitingEnrollments.size} enrollments ready to resume`
      );

      // Batch update to reactivate enrollments
      const batch = db.batch();
      let reactivatedCount = 0;

      waitingEnrollments.docs.forEach((doc) => {
        const enrollment = doc.data();

        // Double-check the enrollment is still valid
        if (
          enrollment.status === 'waiting' &&
          enrollment.nextExecutionAt &&
          enrollment.nextExecutionAt.toMillis() <= now.toMillis()
        ) {
          functions.logger.info(`Reactivating enrollment ${doc.id}`);

          batch.update(doc.ref, {
            status: 'active',
            nextExecutionAt: admin.firestore.FieldValue.delete(),
            lastExecutedAt: admin.firestore.Timestamp.now(),
          });

          reactivatedCount++;
        }
      });

      // Commit all updates
      if (reactivatedCount > 0) {
        await batch.commit();
        functions.logger.info(`Reactivated ${reactivatedCount} enrollments`);
      }

      return {
        reactivatedCount,
        timestamp: now.toDate().toISOString(),
      };
    } catch (error) {
      functions.logger.error('Error in workflow scheduler:', error);
      throw error;
    }
  });

/**
 * HTTP-triggered scheduler (for manual testing or custom scheduling)
 *
 * Usage:
 * curl -X POST https://your-region-your-project.cloudfunctions.net/resumeDelayedWorkflows
 */
export const resumeDelayedWorkflows = functions.https.onRequest(
  async (req, res) => {
    functions.logger.info('Manual workflow resume triggered');

    const now = admin.firestore.Timestamp.now();

    try {
      // Query for enrollments that are waiting and ready to resume
      const waitingEnrollments = await db
        .collection('workflowEnrollments')
        .where('status', '==', 'waiting')
        .where('nextExecutionAt', '<=', now)
        .limit(500) // Higher limit for manual trigger
        .get();

      if (waitingEnrollments.empty) {
        res.status(200).json({
          success: true,
          message: 'No enrollments ready to resume',
          reactivatedCount: 0,
        });
        return;
      }

      functions.logger.info(
        `Found ${waitingEnrollments.size} enrollments ready to resume`
      );

      // Batch update to reactivate enrollments
      const batch = db.batch();
      let reactivatedCount = 0;

      waitingEnrollments.docs.forEach((doc) => {
        const enrollment = doc.data();

        if (
          enrollment.status === 'waiting' &&
          enrollment.nextExecutionAt &&
          enrollment.nextExecutionAt.toMillis() <= now.toMillis()
        ) {
          functions.logger.info(`Reactivating enrollment ${doc.id}`);

          batch.update(doc.ref, {
            status: 'active',
            nextExecutionAt: admin.firestore.FieldValue.delete(),
            lastExecutedAt: admin.firestore.Timestamp.now(),
          });

          reactivatedCount++;
        }
      });

      // Commit all updates
      if (reactivatedCount > 0) {
        await batch.commit();
        functions.logger.info(`Reactivated ${reactivatedCount} enrollments`);
      }

      res.status(200).json({
        success: true,
        message: `Reactivated ${reactivatedCount} workflows`,
        reactivatedCount,
        timestamp: now.toDate().toISOString(),
      });
    } catch (error) {
      functions.logger.error('Error resuming workflows:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
);

/**
 * Watcher for Deal Changes - Creates workflow enrollments when triggers match
 *
 * Listens to deal changes and automatically enrolls them in matching workflows
 */
export const workflowDealWatcher = functions.firestore
  .document('deals/{dealId}')
  .onWrite(async (change, context) => {
    const dealId = context.params.dealId;

    // Skip if deleted
    if (!change.after.exists) {
      return;
    }

    const dealData = change.after.data();
    const previousDealData = change.before.exists ? change.before.data() : null;

    // Determine the trigger event
    const isCreated = !change.before.exists;
    const isUpdated = change.before.exists;

    // Detect specific changes
    const statusChanged =
      previousDealData && previousDealData.status !== dealData.status;
    const stageChanged =
      previousDealData && previousDealData.stageId !== dealData.stageId;

    functions.logger.info(
      `Deal ${dealId} changed. Created: ${isCreated}, Updated: ${isUpdated}, StatusChanged: ${statusChanged}, StageChanged: ${stageChanged}`
    );

    // Fetch all active workflows
    const workflowsSnapshot = await db
      .collection('workflowDefinitions')
      .where('isActive', '==', true)
      .get();

    if (workflowsSnapshot.empty) {
      functions.logger.info('No active workflows found');
      return;
    }

    // Check each workflow's trigger conditions
    const enrollmentsToCreate: any[] = [];

    for (const workflowDoc of workflowsSnapshot.docs) {
      const workflow = workflowDoc.data();
      const startNode = workflow.nodes?.[workflow.startNodeId];

      if (!startNode || startNode.type !== 'trigger') {
        continue;
      }

      // Check if trigger matches
      const trigger = startNode.trigger;
      let shouldEnroll = false;

      if (trigger === 'deal_created' && isCreated) {
        shouldEnroll = true;
      } else if (trigger === 'deal_updated' && isUpdated) {
        shouldEnroll = true;
      } else if (trigger === 'deal_status_changed' && statusChanged) {
        // Check if status matches specific value (if configured)
        if (startNode.statusValue) {
          shouldEnroll = dealData.status === startNode.statusValue;
        } else {
          shouldEnroll = true;
        }
      } else if (trigger === 'deal_stage_changed' && stageChanged) {
        // Check if stage matches specific value (if configured)
        if (startNode.stageId) {
          shouldEnroll = dealData.stageId === startNode.stageId;
        } else {
          shouldEnroll = true;
        }
      }

      if (shouldEnroll) {
        functions.logger.info(
          `Enrolling deal ${dealId} in workflow ${workflowDoc.id}`
        );

        enrollmentsToCreate.push({
          workflowId: workflowDoc.id,
          targetType: 'deal',
          targetId: dealId,
          status: 'active',
          currentNodeId: startNode.nextId || workflow.startNodeId, // Start at first node after trigger
          visitedNodes: [workflow.startNodeId], // Mark trigger as visited
          executionPath: [
            {
              nodeId: workflow.startNodeId,
              timestamp: admin.firestore.Timestamp.now(),
              result: 'success',
            },
          ],
          context: {
            triggerEvent: trigger,
            triggerTimestamp: admin.firestore.Timestamp.now(),
          },
          startedAt: admin.firestore.Timestamp.now(),
          errorCount: 0,
        });
      }
    }

    // Create all enrollments
    if (enrollmentsToCreate.length > 0) {
      const batch = db.batch();

      enrollmentsToCreate.forEach((enrollment) => {
        const enrollmentRef = db.collection('workflowEnrollments').doc();
        batch.set(enrollmentRef, enrollment);
      });

      await batch.commit();

      functions.logger.info(
        `Created ${enrollmentsToCreate.length} workflow enrollments for deal ${dealId}`
      );
    }
  });
