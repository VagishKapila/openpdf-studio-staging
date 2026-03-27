import { db } from '../../shared/db';
import { signingReminders, signatureRequests, documents } from '../../shared/db/schema';
import { eq, and, lte, isNull, desc } from 'drizzle-orm';
import { notifyReminderSent } from '../notifications/notification.service';

export interface ScheduleReminderParams {
  requestId: string;
  orgId?: string;
  recipientEmail: string;
  message?: string;
  scheduledAt: Date;
  type?: 'auto' | 'manual' | 'escalation';
  channel?: 'email' | 'sms' | 'in_app';
}

export async function scheduleReminder(params: ScheduleReminderParams) {
  try {
    const [reminder] = await db.insert(signingReminders).values({
      requestId: params.requestId,
      orgId: params.orgId || null,
      type: params.type || 'auto',
      channel: params.channel || 'email',
      scheduledAt: params.scheduledAt,
      recipientEmail: params.recipientEmail,
      message: params.message || null,
      attempt: 1,
    }).returning();

    return reminder;
  } catch (error) {
    console.error('[reminders] Failed to schedule reminder:', error);
    return null;
  }
}

// Auto-schedule reminders for a new signature request
export async function autoScheduleReminders(requestId: string, orgId: string | null, recipientEmail: string, deadline?: Date) {
  const now = new Date();

  // Reminder 1: 24 hours after sending
  const reminder1Date = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  await scheduleReminder({
    requestId,
    orgId: orgId || undefined,
    recipientEmail,
    message: 'Friendly reminder: you have a document waiting for your signature.',
    scheduledAt: reminder1Date,
    type: 'auto',
  });

  // Reminder 2: 3 days after sending
  const reminder2Date = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  await scheduleReminder({
    requestId,
    orgId: orgId || undefined,
    recipientEmail,
    message: 'This document still requires your signature. Please review and sign at your earliest convenience.',
    scheduledAt: reminder2Date,
    type: 'auto',
  });

  // Reminder 3: 7 days — escalation
  const reminder3Date = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  await scheduleReminder({
    requestId,
    orgId: orgId || undefined,
    recipientEmail,
    message: 'Urgent: this document has been waiting for your signature for over a week.',
    scheduledAt: reminder3Date,
    type: 'escalation',
  });

  // If deadline set, reminder 1 day before
  if (deadline && deadline.getTime() > now.getTime() + 2 * 24 * 60 * 60 * 1000) {
    const deadlineReminder = new Date(deadline.getTime() - 24 * 60 * 60 * 1000);
    await scheduleReminder({
      requestId,
      orgId: orgId || undefined,
      recipientEmail,
      message: `This document's signing deadline is tomorrow. Please sign before it expires.`,
      scheduledAt: deadlineReminder,
      type: 'escalation',
    });
  }
}

// Process due reminders (called by a periodic job or on request)
export async function processDueReminders() {
  const now = new Date();

  try {
    const dueReminders = await db
      .select({
        reminder: signingReminders,
        request: signatureRequests,
      })
      .from(signingReminders)
      .innerJoin(signatureRequests, eq(signatureRequests.id, signingReminders.requestId))
      .where(and(
        lte(signingReminders.scheduledAt, now),
        isNull(signingReminders.sentAt),
      ))
      .orderBy(signingReminders.scheduledAt)
      .limit(50);

    let processed = 0;
    for (const { reminder, request } of dueReminders) {
      // Skip if request is already signed/declined
      if (['signed', 'declined', 'expired'].includes(request.status)) {
        // Mark reminder as sent (skip it)
        await db.update(signingReminders)
          .set({ sentAt: now })
          .where(eq(signingReminders.id, reminder.id));
        continue;
      }

      // TODO: Actually send the email/SMS here using email.service.ts
      // For now, just mark as sent and create a notification for the sender
      await db.update(signingReminders)
        .set({ sentAt: now })
        .where(eq(signingReminders.id, reminder.id));

      // Notify the document sender that a reminder was sent
      await notifyReminderSent(
        request.senderId,
        reminder.orgId,
        reminder.recipientEmail,
        'Document', // Would need to join documents table for name
      );

      processed++;
    }

    return { processed, total: dueReminders.length };
  } catch (error) {
    console.error('[reminders] Failed to process reminders:', error);
    return { processed: 0, total: 0, error: String(error) };
  }
}

// Get reminders for a signature request
export async function getRemindersForRequest(requestId: string) {
  return db
    .select()
    .from(signingReminders)
    .where(eq(signingReminders.requestId, requestId))
    .orderBy(desc(signingReminders.scheduledAt));
}
