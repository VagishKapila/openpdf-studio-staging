import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { requireAuth, getUser } from '../../shared/middleware/auth';
import { db } from '../../shared/db';
import { notificationInbox } from '../../shared/db/schema';
import { eq, and, desc, count } from 'drizzle-orm';
import { addSSEConnection, removeSSEConnection } from './notification.service';

const notifications = new Hono();
notifications.use('/*', requireAuth);

// ── SSE Stream ──
notifications.get('/stream', async (c) => {
  const userId = getUser(c).id;

  return streamSSE(c, async (stream) => {
    // Create a controller for this connection
    let controller: ReadableStreamDefaultController | null = null;

    try {
      // Send initial connection event
      await stream.writeSSE({
        event: 'connected',
        data: JSON.stringify({ userId, timestamp: new Date().toISOString() }),
      });

      // Keep connection alive with heartbeat
      const heartbeat = setInterval(async () => {
        try {
          await stream.writeSSE({
            event: 'heartbeat',
            data: JSON.stringify({ timestamp: new Date().toISOString() }),
          });
        } catch {
          clearInterval(heartbeat);
        }
      }, 30_000);

      // Clean up on disconnect
      stream.onAbort(() => {
        clearInterval(heartbeat);
        if (controller) {
          removeSSEConnection(userId, controller);
        }
      });

      // Keep the stream open (never resolves — stream stays open until client disconnects)
      await new Promise(() => {});
    } catch (error) {
      console.error('[notifications] SSE error:', error);
    }
  });
});

// ── Get Notifications ──
notifications.get('/', async (c) => {
  const userId = getUser(c).id;
  const limit = parseInt(c.req.query('limit') || '30');
  const unreadOnly = c.req.query('unread') === 'true';

  try {
    const conditions = unreadOnly
      ? and(eq(notificationInbox.userId, userId), eq(notificationInbox.read, false))
      : eq(notificationInbox.userId, userId);

    const rows = await db
      .select()
      .from(notificationInbox)
      .where(conditions)
      .orderBy(desc(notificationInbox.createdAt))
      .limit(limit);

    const [{ unreadCount }] = await db
      .select({ unreadCount: count() })
      .from(notificationInbox)
      .where(and(eq(notificationInbox.userId, userId), eq(notificationInbox.read, false)));

    return c.json({ data: rows, meta: { unreadCount } });
  } catch (err: any) {
    return c.json({ error: 'Failed to fetch notifications' }, 500);
  }
});

// ── Mark as Read ──
notifications.patch('/:id/read', async (c) => {
  const userId = getUser(c).id;
  const notifId = c.req.param('id')!;

  try {
    await db
      .update(notificationInbox)
      .set({ read: true })
      .where(and(eq(notificationInbox.id, notifId), eq(notificationInbox.userId, userId)));

    return c.json({ message: 'Marked as read' });
  } catch (err: any) {
    return c.json({ error: 'Failed to mark notification' }, 500);
  }
});

// ── Mark All as Read ──
notifications.patch('/read-all', async (c) => {
  const userId = getUser(c).id;

  try {
    await db
      .update(notificationInbox)
      .set({ read: true })
      .where(and(eq(notificationInbox.userId, userId), eq(notificationInbox.read, false)));

    return c.json({ message: 'All notifications marked as read' });
  } catch (err: any) {
    return c.json({ error: 'Failed to mark notifications' }, 500);
  }
});

export default notifications;
