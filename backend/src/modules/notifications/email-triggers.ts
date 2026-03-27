import { createNotification } from './notification.service';

// Triggered when a document is sent for signing
export async function onDocumentSent(params: {
  senderName: string;
  recipientEmail: string;
  recipientName: string;
  documentName: string;
  signingUrl: string;
  message?: string;
}) {
  // Email will be sent via email.service.ts
  // For now, just log
  console.log(`[email-trigger] Document sent: ${params.documentName} to ${params.recipientEmail}`);
}

// Triggered when a document is signed
export async function onDocumentSigned(params: {
  senderId: string;
  orgId: string | null;
  documentName: string;
  signerName: string;
  signerEmail: string;
}) {
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
}

// Triggered when payment is received
export async function onPaymentReceived(params: {
  creatorId: string;
  orgId: string | null;
  amount: number;
  currency: string;
  documentName: string;
  payerEmail: string;
}) {
  await createNotification({
    userId: params.creatorId,
    orgId: params.orgId || undefined,
    type: 'payment.received',
    title: 'Payment Received',
    message: `$${(params.amount / 100).toFixed(2)} ${params.currency.toUpperCase()} received from ${params.payerEmail} for "${params.documentName}"`,
    data: {
      amount: params.amount,
      currency: params.currency,
      documentName: params.documentName,
      payerEmail: params.payerEmail,
    },
  });
}

// Triggered when a document is about to expire
export async function onDocumentExpiring(params: {
  senderId: string;
  orgId: string | null;
  documentName: string;
  recipientEmail: string;
  deadline: string;
}) {
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
}
