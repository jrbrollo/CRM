/**
 * API Webhooks
 *
 * HTTP endpoints for external integrations and manual workflow triggers.
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { executeWorkflow } from "../automation/workflowEngine";

const db = admin.firestore();

/**
 * Enroll a contact in a workflow via API
 */
export const enrollContactInWorkflow = functions.https.onCall(
  async (data, context) => {
    // Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated"
      );
    }

    const { contactId, workflowId } = data;

    if (!contactId || !workflowId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Missing contactId or workflowId"
      );
    }

    functions.logger.info(
      `Enrolling contact ${contactId} in workflow ${workflowId}`
    );

    try {
      // Verify contact exists
      const contactDoc = await db.collection("contacts").doc(contactId).get();

      if (!contactDoc.exists) {
        throw new functions.https.HttpsError(
          "not-found",
          `Contact ${contactId} not found`
        );
      }

      // Verify workflow exists and is active
      const workflowDoc = await db.collection("workflows").doc(workflowId).get();

      if (!workflowDoc.exists) {
        throw new functions.https.HttpsError(
          "not-found",
          `Workflow ${workflowId} not found`
        );
      }

      const workflow = workflowDoc.data()!;

      if (workflow.status !== "active") {
        throw new functions.https.HttpsError(
          "failed-precondition",
          `Workflow ${workflowId} is not active`
        );
      }

      // Add workflow to contact's enrolled workflows
      await contactDoc.ref.update({
        enrolledWorkflows: admin.firestore.FieldValue.arrayUnion(workflowId),
        workflowHistory: admin.firestore.FieldValue.arrayUnion({
          workflowId,
          enrolledAt: admin.firestore.FieldValue.serverTimestamp(),
          status: "active",
        }),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Execute workflow
      await executeWorkflow(workflowId, contactId, "contact");

      // Update workflow stats
      await workflowDoc.ref.update({
        "stats.totalEnrolled": admin.firestore.FieldValue.increment(1),
        "stats.currentlyEnrolled": admin.firestore.FieldValue.increment(1),
      });

      return {
        success: true,
        message: `Contact enrolled in workflow successfully`,
        contactId,
        workflowId,
      };
    } catch (error) {
      functions.logger.error(
        `Error enrolling contact ${contactId} in workflow ${workflowId}:`,
        error
      );

      if (error instanceof functions.https.HttpsError) {
        throw error;
      }

      throw new functions.https.HttpsError(
        "internal",
        error instanceof Error ? error.message : "Unknown error occurred"
      );
    }
  }
);

/**
 * Update lead score via API
 */
export const updateLeadScore = functions.https.onCall(
  async (data, context) => {
    // Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated"
      );
    }

    const { contactId, score, reason } = data;

    if (!contactId || score === undefined) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Missing contactId or score"
      );
    }

    if (score < 0 || score > 100) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Score must be between 0 and 100"
      );
    }

    functions.logger.info(`Updating lead score for contact ${contactId} to ${score}`);

    try {
      // Update contact lead score
      await db.collection("contacts").doc(contactId).update({
        leadScore: score,
        leadScoreUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Create activity record
      await db.collection("activities").add({
        type: "note",
        title: "Lead Score Updated",
        description: `Lead score updated to ${score}${reason ? `: ${reason}` : ""}`,
        contactId,
        entityId: contactId,
        entityType: "contact",
        createdBy: context.auth.uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return {
        success: true,
        message: "Lead score updated successfully",
        contactId,
        newScore: score,
      };
    } catch (error) {
      functions.logger.error(
        `Error updating lead score for contact ${contactId}:`,
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
 * Webhook receiver for external form submissions
 */
export const receiveFormSubmission = functions.https.onRequest(
  async (req, res) => {
    // Verify API key
    const apiKey = req.headers["x-api-key"];

    if (!apiKey) {
      res.status(401).json({ error: "Missing API key" });
      return;
    }

    // TODO: Verify API key against stored keys in Firestore

    functions.logger.info("Received form submission", { body: req.body });

    try {
      const { firstName, lastName, email, phone, formId, customFields } =
        req.body;

      if (!firstName || !email) {
        res.status(400).json({ error: "Missing required fields" });
        return;
      }

      // Create contact
      const contactData = {
        firstName,
        lastName: lastName || "",
        email,
        phone: phone || "",
        source: `form_${formId}`,
        status: "new",
        leadScore: 0,
        lifecycle_stage: "lead",
        customFields: customFields || {},
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      const contactRef = await db.collection("contacts").add(contactData);

      functions.logger.info(`Created contact ${contactRef.id} from form submission`);

      res.status(200).json({
        success: true,
        message: "Form submission processed successfully",
        contactId: contactRef.id,
      });
    } catch (error) {
      functions.logger.error("Error processing form submission:", error);

      res.status(500).json({
        error: "Internal server error",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  }
);
