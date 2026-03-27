import { db } from '../db';
import { notificationInbox, users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { sendNotificationEmail } from './email.service';

/**
 * In-memory queue for batched notifications
 * Groups notifications by userId and batches them over a time window
 */

interface QueuedNotification {
  userId: string;
  orgId?: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  createdAt: Date;
}

const notificationQueue: Map<string, QueuedNotification[]> = new Map();
const BATCH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
let batchTimer: NodeJS.Timeout | null = null;

/**
 * Queue a notification for batching
 * If this is the first notification in the batch window, starts a timer to flush all batches
 */
export function queueNotification(notification: QueuedNotification): void {
  const key = notification.userId;
  const existing = notificationQueue.get(key) || [];
  existing.push({ ...notification, createdAt: new Date() });
  notificationQueue.set(key, existing);

  // Start timer if not running
  if (!batchTimer) {
    console.log(`[notification-batch] Starting batch timer (${BATCH_INTERVAL_MS}ms)`);
    batchTimer = setTimeout(flushAllBatches, BATCH_INTERVAL_MS);
  }
}

/**
 * Flush all queued notification batches
 * Single notifications are delivered immediately, multiple ones are batched into a digest email
 */
export async function flushAllBatches(): Promise<void> {
  const entries = Array.from(notificationQueue.entries());
  notificationQueue.clear();
  batchTimer = null;

  if (entries.length === 0) {
    console.log(`[notification-batch] No notifications to flush`);
    return;
  }

  console.log(`[notification-batch] Flushing batches for ${entries.length} user(s)`);

  for (const [userId, notifications] of entries) {
    if (notifications.length === 0) continue;

    if (notifications.length === 1) {
      // Single notification — save to DB and optionally send email
      await deliverSingleNotification(userId, notifications[0]);
    } else {
      // Multiple notifications — batch into digest
      await deliverBatchedNotifications(userId, notifications);
    }
  }

  console.log(`[notification-batch] Batch flush complete`);
}

/**
 * Deliver a single notification to the database
 * Optionally send an email for high-priority types
 */
async function deliverSingleNotification(userId: string, notification: QueuedNotification): Promise<void> {
  try {
    // Save to notification_inbox table
    await db.insert(notificationInbox).values({
      userId,
      orgId: notification.orgId ? notification.orgId : null,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data || null,
    });

    console.log(`[notification-batch] Saved single notification for user ${userId}: ${notification.type}`);

    // Optionally send email for high-priority notifications
    if (shouldSendEmailForType(notification.type)) {
      const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (user && user.length > 0) {
        await sendNotificationEmail(
          user[0].email,
          `${notification.title} — DocPix Studio`,
          notification.title,
          notification.message,
        ).catch(err => {
          console.error(`[notification-batch] Failed to send email for notification ${notification.type}:`, err);
        });
      }
    }
  } catch (error) {
    console.error(`[notification-batch] Failed to deliver single notification for user ${userId}:`, error);
  }
}

/**
 * Deliver multiple notifications as a batched digest
 * Saves all notifications to DB and sends a single digest email
 */
async function deliverBatchedNotifications(userId: string, notifications: QueuedNotification[]): Promise<void> {
  try {
    // Save all notifications to notification_inbox
    const valuesToInsert = notifications.map(n => ({
      userId,
      orgId: n.orgId ? n.orgId : null,
      type: n.type,
      title: n.title,
      message: n.message,
      data: n.data || null,
    }));

    await db.insert(notificationInbox).values(valuesToInsert);

    console.log(`[notification-batch] Saved ${notifications.length} notifications for user ${userId}`);

    // Get user info for sending digest email
    const userRecords = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!userRecords || userRecords.length === 0) {
      console.warn(`[notification-batch] User ${userId} not found`);
      return;
    }

    const user = userRecords[0];

    // Build digest email
    const digestHtml = buildNotificationDigestHtml(user.name || 'there', notifications);

    // Send digest email
    await sendNotificationEmail(
      user.email,
      `You have ${notifications.length} new notifications — DocPix Studio`,
      'Notification Digest',
      digestHtml,
    ).catch(err => {
      console.error(`[notification-batch] Failed to send digest email to ${user.email}:`, err);
    });

    console.log(`[notification-batch] Sent digest email to ${user.email} (${notifications.length} notifications)`);
  } catch (error) {
    console.error(`[notification-batch] Failed to deliver batched notifications for user ${userId}:`, error);
  }
}

/**
 * Determine if a notification type should trigger an immediate email
 */
function shouldSendEmailForType(type: string): boolean {
  // Send emails for high-priority events
  const emailTypes = [
    'document.signed',
    'payment.received',
    'system.alert',
  ];
  return emailTypes.includes(type);
}

/**
 * Build HTML for notification digest email
 */
function buildNotificationDigestHtml(userName: string, notifications: QueuedNotification[]): string {
  const notificationItems = notifications
    .map(n => `
      <li style="margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid #e5e7eb;">
        <p style="margin:0;color:#18181b;font-size:14px;font-weight:600;">${n.title}</p>
        <p style="margin:4px 0 0;color:#71717a;font-size:13px;line-height:1.4;">${n.message}</p>
        <p style="margin:6px 0 0;color:#a1a1aa;font-size:12px;">${n.createdAt.toLocaleString()}</p>
      </li>
    `)
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 24px;text-align:center;">
      <div style="display:inline-flex;align-items:center;gap:8px;">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="3" width="18" height="18" rx="3" fill="white" fill-opacity="0.2"/>
          <path d="M7 8h10M7 12h7M7 16h4" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
          <circle cx="17" cy="15" r="3" fill="white" fill-opacity="0.3" stroke="white" stroke-width="1.5"/>
        </svg>
        <span style="color:white;font-size:20px;font-weight:700;letter-spacing:-0.5px;">DocPix Studio</span>
      </div>
    </div>
    <div style="padding:32px 24px;">
      <h1 style="margin:0 0 8px;font-size:22px;color:#18181b;">You have ${notifications.length} new notifications</h1>
      <p style="margin:0 0 24px;color:#71717a;font-size:15px;line-height:1.5;">
        Hi ${userName}, here's a summary of what happened in your DocPix Studio account.
      </p>

      <ul style="margin:0;padding:0;list-style:none;">
        ${notificationItems}
      </ul>

      <p style="margin:24px 0 0;color:#71717a;font-size:14px;line-height:1.5;">
        Log in to your dashboard to see all your notifications and take action.
      </p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Manually flush all batches immediately (useful for testing or graceful shutdown)
 */
export async function flushNow(): Promise<void> {
  if (batchTimer) {
    clearTimeout(batchTimer);
  }
  await flushAllBatches();
}

/**
 * Get the number of currently queued notifications (for monitoring/debugging)
 */
export function getQueuedNotificationCount(): number {
  return Array.from(notificationQueue.values()).reduce((sum, notifs) => sum + notifs.length, 0);
}

/**
 * Clear all queued notifications without sending (for testing only)
 */
export function clearQueue(): void {
  notificationQueue.clear();
  if (batchTimer) {
    clearTimeout(batchTimer);
    batchTimer = null;
  }
}
