import { createNotification } from './notification.service';
import { sendNotificationEmail } from '../../shared/services/email.service';

// Triggered when a document is sent for signing
export async function onDocumentSent(params: {
  senderName: string;
  recipientEmail: string;
  recipientName: string;
  documentName: string;
  signingUrl: string;
  message?: string;
}) {
  try {
    // Send email to recipient
    await sendNotificationEmail(
      params.recipientEmail,
      `${params.senderName} sent you a document to sign — DocPix Studio`,
      `${params.senderName} sent you a document`,
      `${params.senderName} has sent you "${params.documentName}" for your signature.${params.message ? ` ${params.message}` : ''} Click the button below to review and sign the document.`,
      'Review Document',
      params.signingUrl,
    );
  } catch (error) {
    console.error(`[email-trigger] Failed to send document sent email: ${error}`);
  }
}

// Triggered when a document is signed
export async function onDocumentSigned(params: {
  senderId: string;
  senderEmail: string;
  orgId: string | null;
  documentName: string;
  signerName: string;
  signerEmail: string;
}) {
  try {
    // Create in-app notification
    await createNotification({
      userId: params.senderId,
      orgId: params.orgId || undefined,
      type: 'document.signed',
      title: 'Document Signed',
      message: `${params.signerName} (${params.signerEmail}) signed "${params.documentName}"`,
      data: {
        documentName: params.documentName,
        signerName: params.signerName,
        signerEmail: params.signerEmail,
      },
    });

    // Send email notification to sender
    await sendNotificationEmail(
      params.senderEmail,
      `${params.signerName} signed your document — DocPix Studio`,
      `Document Signed`,
      `Great news! ${params.signerName} has signed "${params.documentName}". The signed document is ready for download.`,
    );
  } catch (error) {
    console.error(`[email-trigger] Failed to send document signed email: ${error}`);
  }
}

// Triggered when payment is received
export async function onPaymentReceived(params: {
  creatorId: string;
  creatorEmail: string;
  orgId: string | null;
  amount: number;
  currency: string;
  documentName: string;
  payerEmail: string;
}) {
  try {
    const formattedAmount = `${(params.amount / 100).toFixed(2)} ${params.currency.toUpperCase()}`;

    // Create in-app notification
    await createNotification({
      userId: params.creatorId,
      orgId: params.orgId || undefined,
      type: 'payment.received',
      title: 'Payment Received',
      message: `${formattedAmount} received from ${params.payerEmail} for "${params.documentName}"`,
      data: {
        amount: params.amount,
        currency: params.currency,
        documentName: params.documentName,
        payerEmail: params.payerEmail,
      },
    });

    // Send email notification to creator
    await sendNotificationEmail(
      params.creatorEmail,
      `Payment received — ${formattedAmount} for ${params.documentName}`,
      `Payment Received`,
      `Payment of ${formattedAmount} has been received from ${params.payerEmail} for "${params.documentName}". Check your dashboard for details.`,
    );
  } catch (error) {
    console.error(`[email-trigger] Failed to send payment received email: ${error}`);
  }
}

// Triggered when a document is about to expire
export async function onDocumentExpiring(params: {
  senderId: string;
  senderEmail: string;
  orgId: string | null;
  documentName: string;
  recipientEmail: string;
  deadline: string;
}) {
  try {
    // Create in-app notification
    await createNotification({
      userId: params.senderId,
      orgId: params.orgId || undefined,
      type: 'system.alert',
      title: 'Document Expiring',
      message: `The signing request for "${params.documentName}" sent to ${params.recipientEmail} expires on ${params.deadline}`,
      data: {
        documentName: params.documentName,
        recipientEmail: params.recipientEmail,
        deadline: params.deadline,
      },
    });

    // Send email notification to sender
    await sendNotificationEmail(
      params.senderEmail,
      `Reminder: Signing deadline approaching — DocPix Studio`,
      `Document Expiring Soon`,
      `The signing request for "${params.documentName}" sent to ${params.recipientEmail} will expire on ${params.deadline}. If it's not signed by then, the recipient will no longer be able to access it.`,
    );
  } catch (error) {
    console.error(`[email-trigger] Failed to send document expiring email: ${error}`);
  }
}
