import { Hono } from 'hono';
import { requireAuth, getUser } from '../../shared/middleware/auth';
import { requireSuperAdmin } from '../../shared/middleware/admin.middleware';
import { processDueReminders, scheduleReminder, getRemindersForRequest } from './reminder.service';

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

export default reminders;
