/**
 * Email Service using Resend
 *
 * Handles sending transactional emails via Resend API.
 */

import * as functions from "firebase-functions";
import { Resend } from "resend";

// Initialize Resend with API key from environment
const resendApiKey = functions.config().resend?.api_key;
let resend: Resend | null = null;

if (resendApiKey) {
  resend = new Resend(resendApiKey);
} else {
  functions.logger.warn("Resend API key not configured. Emails will be logged only.");
}

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

/**
 * Send a transactional email
 */
export async function sendEmail(params: SendEmailParams): Promise<void> {
  const {
    to,
    subject,
    html,
    text,
    from = "CRM Braúna <noreply@seudominio.com.br>", // Substitua pelo seu domínio
    replyTo,
  } = params;

  functions.logger.info("Sending email", {
    to: Array.isArray(to) ? to.join(", ") : to,
    subject,
  });

  // If Resend is not configured, just log
  if (!resend) {
    functions.logger.warn("Email not sent (Resend not configured)", {
      to,
      subject,
      html: html?.substring(0, 100),
    });
    return;
  }

  try {
    await resend.emails.send({
      from,
      to,
      subject,
      html: html || text || "",
      text,
      reply_to: replyTo,
    });

    functions.logger.info("Email sent successfully", { to, subject });
  } catch (error) {
    functions.logger.error("Error sending email", error);
    throw new Error(`Failed to send email: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Send email with template variables
 */
export async function sendTemplateEmail(
  to: string | string[],
  subject: string,
  templateHtml: string,
  variables: Record<string, any>
): Promise<void> {
  // Simple variable replacement
  let html = templateHtml;
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, "g");
    html = html.replace(regex, String(value));
  });

  await sendEmail({
    to,
    subject,
    html,
  });
}
