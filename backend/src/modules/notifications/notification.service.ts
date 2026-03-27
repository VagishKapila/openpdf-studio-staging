import { db } from '../../shared/db';
import { notificationInbox } from '../../shared/db/schema';
import { eq, and } from 'drizzle-orm';

// Store active SSE connections per user
const sseConnections = new Map<string, Set<ReadableStreamDefaultController>>();

export interface CreateNotificationParams {
  userId: string;
  orgId?: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

export async function createNotification(params: CreateNotificationParams) {
  try {
    const [notif] = await db.insert(notificationInbox).values({
      userId: params.userId,
      orgId: params.orgId || null,
      type: params.type,
      title: params.title,
      message: params.message,
      data: params.data || null,
    }).returning();

    // Push to SSE if user is connected
    broadcastToUser(params.userId, {
      type: 'notification',
      data: notif,
    });

    return notif;
  } catch (error) {
    console.error('[notifications] Failed to create notification:', error);
    return null;
  }
}

export function broadcastToUser(userId: string, event: { type: string; data: unknown }) {
  const connections = sseConnections.get(userId);
  if (!connections) return;

  const message = `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`;
  for (const controller of connections) {
    try {
      controller.enqueue(new TextEncoder().encode(message));
    } catch {
      connections.delete(controller);
    }
  }
}

export function addSSEConnection(userId: string, controller: ReadableStreamDefaultController) {
  if (!sseConnections.has(userId)) {
    sseConnections.set(userId, new Set());
  }
  sseConnections.get(userId)!.add(controller);
}

export function removeSSEConnection(userId: string, controller: ReadableStreamDefaultController) {
  const connections = sseConnections.get(userId);
  if (connections) {
    connections.delete(controller);
    if (connections.size === 0) {
      sseConnections.delete(userId);
    }
  }
}

// ── Convenience notification creators ──

export async function notifyDocumentSigned(userId: string, orgId: string | null, docName: string, signerName: string) {
  return createNotification({
    userId,
    orgId: orgId || undefined,
    type: 'document.signed',
    title: 'Document Signed',
    message: `${signerName} signed "${docName}"`,
    data: { docName, signerName },
  });
}

export async function notifyPaymentReceived(userId: string, orgId: string | null, amount: number, docName: string) {
  return createNotification({
    userId,
    orgId: orgId || undefined,
    type: 'payment.received',
    title: 'Payment Received',
    message: `$${(amount / 100).toFixed(2)} received for "${docName}"`,
    data: { amount, docName },
  });
}

export async function notifyReminderSent(userId: string, orgId: string | null, recipientEmail: string, docName: string) {
  return createNotification({
    userId,
    orgId: orgId || undefined,
    type: 'reminder.sent',
    title: 'Reminder Sent',
    message: `Signing reminder sent to ${recipientEmail} for "${docName}"`,
    data: { recipientEmail, docName },
  });
}

export async function notifySystemAlert(userId: string, title: string, message: string, data?: Record<string, unknown>) {
  return createNotification({
    userId,
    type: 'system.alert',
    title,
    message,
    data,
  });
}
