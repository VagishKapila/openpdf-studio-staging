import { Hono } from 'hono';
import { requireAuth, getUser } from '../../shared/middleware/auth';
import { db } from '../../shared/db';
import { documents, payments, signatureRequests, auditLog } from '../../shared/db/schema';
import { eq, desc, sql, and, count } from 'drizzle-orm';

const dashboardRoutes = new Hono();

// ===== DASHBOARD STATS =====
// GET /dashboard/stats
dashboardRoutes.get('/stats', requireAuth, async (c) => {
  try {
    const userId = getUser(c).id;

    const [docCount] = await db.select({ count: count() })
      .from(documents)
      .where(eq(documents.userId, userId));

    const [paymentStats] = await db.select({
      count: count(),
      total: sql<number>`COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0)`,
      pending: sql<number>`COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0)`,
    }).from(payments).where(eq(payments.creatorId, userId));

    const [sigCount] = await db.select({ count: count() })
      .from(signatureRequests)
      .where(eq(signatureRequests.senderId, userId));

    return c.json({
      documents: docCount.count,
      payments: {
        count: paymentStats.count,
        totalCollected: paymentStats.total,
        pendingAmount: paymentStats.pending,
      },
      signatureRequests: sigCount.count,
    });
  } catch (error: any) {
    console.error('Dashboard stats error:', error);
    return c.json({ error: error.message || 'Failed to load stats' }, 500);
  }
});

// ===== LIST DOCUMENTS =====
// GET /dashboard/documents?page=1&limit=20&status=all
dashboardRoutes.get('/documents', requireAuth, async (c) => {
  try {
    const userId = getUser(c).id;
    const page = parseInt(c.req.query('page') || '1');
    const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100);
    const status = c.req.query('status');
    const offset = (page - 1) * limit;

    const conditions = [eq(documents.userId, userId)];
    if (status && status !== 'all') {
      conditions.push(eq(documents.status, status));
    }

    const docs = await db.select()
      .from(documents)
      .where(and(...conditions))
      .orderBy(desc(documents.updatedAt))
      .limit(limit)
      .offset(offset);

    const [total] = await db.select({ count: count() })
      .from(documents)
      .where(and(...conditions));

    return c.json({
      documents: docs,
      pagination: { page, limit, total: total.count, pages: Math.ceil(total.count / limit) },
    });
  } catch (error: any) {
    console.error('List documents error:', error);
    return c.json({ error: error.message || 'Failed to list documents' }, 500);
  }
});

// ===== PAYMENT HISTORY =====
// GET /dashboard/payments?page=1&limit=20
dashboardRoutes.get('/payments', requireAuth, async (c) => {
  try {
    const userId = getUser(c).id;
    const page = parseInt(c.req.query('page') || '1');
    const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100);
    const offset = (page - 1) * limit;

    const paymentList = await db.select({
      id: payments.id,
      documentId: payments.documentId,
      amount: payments.amount,
      currency: payments.currency,
      description: payments.description,
      status: payments.status,
      payerEmail: payments.payerEmail,
      paidAt: payments.paidAt,
      createdAt: payments.createdAt,
    }).from(payments)
      .where(eq(payments.creatorId, userId))
      .orderBy(desc(payments.createdAt))
      .limit(limit)
      .offset(offset);

    const [total] = await db.select({ count: count() })
      .from(payments)
      .where(eq(payments.creatorId, userId));

    return c.json({
      payments: paymentList,
      pagination: { page, limit, total: total.count, pages: Math.ceil(total.count / limit) },
    });
  } catch (error: any) {
    console.error('Payment history error:', error);
    return c.json({ error: error.message || 'Failed to list payments' }, 500);
  }
});

// ===== CONTACTS (derived from signature requests) =====
// GET /dashboard/contacts
dashboardRoutes.get('/contacts', requireAuth, async (c) => {
  try {
    const userId = getUser(c).id;

    const contacts = await db.select({
      email: signatureRequests.recipientEmail,
      name: signatureRequests.recipientName,
      lastInteraction: sql<string>`MAX(${signatureRequests.createdAt})`,
      totalRequests: count(),
      signedCount: sql<number>`SUM(CASE WHEN ${signatureRequests.status} = 'signed' THEN 1 ELSE 0 END)`,
    }).from(signatureRequests)
      .where(eq(signatureRequests.senderId, userId))
      .groupBy(signatureRequests.recipientEmail, signatureRequests.recipientName)
      .orderBy(sql`MAX(${signatureRequests.createdAt}) DESC`);

    return c.json({ contacts });
  } catch (error: any) {
    console.error('Contacts error:', error);
    return c.json({ error: error.message || 'Failed to list contacts' }, 500);
  }
});

// ===== RECENT ACTIVITY =====
// GET /dashboard/activity?limit=20
dashboardRoutes.get('/activity', requireAuth, async (c) => {
  try {
    const userId = getUser(c).id;
    const limit = Math.min(parseInt(c.req.query('limit') || '20'), 50);

    const activity = await db.select()
      .from(auditLog)
      .where(eq(auditLog.userId, userId))
      .orderBy(desc(auditLog.createdAt))
      .limit(limit);

    return c.json({ activity });
  } catch (error: any) {
    console.error('Activity error:', error);
    return c.json({ error: error.message || 'Failed to load activity' }, 500);
  }
});

export { dashboardRoutes };
