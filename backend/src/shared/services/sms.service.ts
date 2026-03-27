import { env } from '../../config/env';

// Telnyx SDK initialization (optional)
let telnyxClient: any = null;

if (env.TELNYX_API_KEY && env.TELNYX_FROM_NUMBER) {
  try {
    // Note: telnyx package must be installed
    // npm install telnyx
    const Telnyx = require('telnyx');
    telnyxClient = new Telnyx(env.TELNYX_API_KEY);
    console.log(`ð± SMS service: configured (Telnyx API enabled)`);
  } catch (error) {
    console.warn(`â ï¸  SMS service: NOT configured (Telnyx SDK not available or API key missing)`);
  }
} else {
  console.warn(`â ï¸  SMS service: NOT configured (TELNYX_API_KEY or TELNYX_FROM_NUMBER missing)`);
}

/**
 * Send a generic SMS message
 * @param to - Phone number in E.164 format (e.g., +14155552671)
 * @param message - SMS text content (max 160 chars for single SMS)
 * @returns true if sent successfully, false if SMS service not configured
 */
export async function sendSMS(to: string, message: string): Promise<boolean> {
  if (!telnyxClient || !env.TELNYX_FROM_NUMBER) {
    console.warn(`[sms] SMS service not configured. SMS to ${to} would contain: ${message}`);
    return false;
  }

  try {
    await telnyxClient.messages.create({
      from: env.TELNYX_FROM_NUMBER,
      to,
      text: message,
    });

    console.log(`[sms] SMS sent to ${to}`);
    return true;
  } catch (error) {
    console.error(`[sms] Failed to send SMS to ${to}:`, error);
    return false;
  }
}

/**
 * Send a branded reminder SMS
 * @param to - Phone number in E.164 format
 * @param documentName - Name of the document
 * @param signerName - Name of the signer
 * @returns true if sent successfully, false otherwise
 */
export async function sendReminderSMS(to: string, documentName: string, signerName: string): Promise<boolean> {
  const message = `Hi ${signerName}, reminder: "${documentName}" is waiting for your signature. Please sign it as soon as possible. Thanks!`;

  // Truncate to fit SMS length if needed
  const truncatedMessage = message.length > 160
    ? message.substring(0, 157) + '...'
    : message;

  return sendSMS(to, truncatedMessage);
}
