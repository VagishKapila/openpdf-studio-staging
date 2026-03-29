import { Hono } from 'hono';
import { requireAuth, getUser } from '../../shared/middleware/auth';
import { requireSuperAdmin } from '../../shared/middleware/admin.middleware';
import { processDueReminders, scheduleReminder, getRemindersForRequest } from './reminder.service';
import { db } from '../../shared/db';
import { signingReminders } from '../../shared/db/schema';
import { eq, count } from 'drizzle-orm';

const reminders = new Hono();
reminders.use('/*', requireAuth);

// ── Get Reminders for a Signature Request ──
reminders.get('/request/:requestId', async (c) => {
  const requestId = c.req.param('requestId')!;
  try {
    const rows = await getRemindersForRequest(requestId);
    return c.json({ data: rows });
  } catch (err: any) {
    return c.json({ error: 'Failed to fetch reminders' }, 500);
  }
});

// ── Schedule a Manual Reminder ──
reminders.post('/', async (c) => {
  const body = await c.req.json() as Record<string, unknown>;

  if (!body.requestId || !body.recipientEmail) {
    return c.json({ error: 'requestId and recipientEmail are required' }, 400);
  }

  try {
    const reminder = await scheduleReminder({
      requestId: body.requestId as string,
      orgId: body.orgId as string | undefined,
      recipientEmail: body.recipientEmail as string,
      message: body.message as string | undefined,
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt as string) : new Date(),
      type: 'manual',
      channel: ((body.channel as string | undefined) || 'email') as 'email' | 'sms' | 'in_app',
    });

    return c.json({ data: reminder }, 201);
  } catch (err: any) {
    return c.json({ error: 'Failed to schedule reminder' }, 500);
  }
});

// ── Process Due Reminders (admin trigger or cron) ──
reminders.post('/process', requireSuperAdmin, async (c) => {
  try {
    const result = await processDueReminders();
    return c.json({ data: result });
  } catch (err: any) {
    return c.json({ error: 'Failed to process reminders' }, 500);
  }
});

// ── Get Reminders for an Organization ──
reminders.get('/org/:orgId', async (c) => {
  const orgId = c.req.param('orgId')!;
  const page = parseInt(c.req.query('page') || '0');
  const limit = parseInt(c.req.query('limit') || '25');

  try {
    const rows = await db
      .select()
      .from(signingReminders)
      .where(eq(signingReminders.orgId, orgId))
      .limit(limit)
      .offset(page * limit);

    const countResult = await db
      .select({ count: count() })
      .from(signingReminders)
      .where(eq(signingReminders.orgId, orgId));

    const total = countResult[0]?.count || 0;

    return c.json({
      data: rows,
      pagination: { page, limit, total },
    });
  } catch (err: any) {
    return c.json({ error: 'Failed to fetch reminders' }, 500);
  }
});

// ── Delete a Reminder ──
reminders.delete('/:id', async (c) => {
  const reminderId = c.req.param('id')!;

  try {
    const [deleted] = await db
      .delete(signingReminders)
      .where(eq(signingReminders.id, reminderId))
      .returning();

    if (!deleted) {
      return c.json({ error: 'Reminder not found' }, 404);
    }

    return c.json({ data: deleted });
  } catch (err: any) {
    return c.json({ error: 'Failed to delete reminder' }, 500);
  }
});

// ── Update/Reschedule a Reminder ──
reminders.patch('/:id', async (c) => {
  const reminderId = c.req.param('id')!;
  const body = await c.req.json() as Record<string, unknown>;

  try {
    const updates: Record<string, unknown> = {};

    if (body.scheduledAt) {
      updates.scheduledAt = new Date(body.scheduledAt as string);
    }
    if (body.message) {
      updates.message = body.message as string;
    }

    if (Object.keys(updates).length === 0) {
      return c.json({ error: 'No fields to update' }, 400);
    }

    const [updated] = await db
      .update(signingReminders)
      .set(updates)
      .where(eq(signingReminders.id, reminderId))
      .returning();

    if (!updated) {
      return c.json({ error: 'Reminder not found' }, 404);
    }

    return c.json({ data: updated });
  } catch (err: any) {
    return c.json({ error: 'Failed to update reminder' }, 500);
  }
});

export default reminders;
