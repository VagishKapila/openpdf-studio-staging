import { Hono } from 'hono';
import { requireAuth } from '../../shared/middleware/auth';
import { requireSuperAdmin } from '../../shared/middleware/admin.middleware';
import { db } from '../../shared/db';
import { users, documents, payments, auditLog, signatureRequests, organizations, feedback } from '../../shared/db/schema';
import { eq, sql, desc, ilike, and, gte, lte, count } from 'drizzle-orm';

const admin = new Hono();

// All admin routes require authentication + super admin
admin.use('/*', requireAuth, requireSuperAdmin);

// ── Dashboard Stats ──
admin.get('/dashboard/stats', async (c) => {
  try {
    const [userStats] = await db.select({
      total: count(),
      verified: sql<number>`count(*) filter (where ${users.emailVerified} = true)`,
      active: sql<number>`count(*) filter (where ${users.isActive} = true)`,
      newToday: sql<number>`count(*) filter (where ${users.createdAt} >= current_date)`,
      newThisWeek: sql<number>`count(*) filter (where ${users.createdAt} >= current_date - interval '7 days')`,
    }).from(users);

    const [docStats] = await db.select({
      total: count(),
      signed: sql<number>`count(*) filter (where ${documents.status} = 'signed' or ${documents.status} = 'completed')`,
      pending: sql<number>`count(*) filter (where ${documents.status} = 'sent' or ${documents.status} = 'viewed')`,
    }).from(documents);

    const [revenueStats] = await db.select({
      total: sql<number>`coalesce(sum(${payments.amount}), 0)`,
      thisMonth: sql<number>`coalesce(sum(${payments.amount}) filter (where ${payments.createdAt} >= date_trunc('month', current_date)), 0)`,
      successRate: sql<number>`case when count(*) > 0 then round(count(*) filter (where ${payments.status} = 'paid')::numeric / count(*)::numeric * 100, 1) else 0 end`,
    }).from(payments);

    const [orgStats] = await db.select({
      total: count(),
      active: sql<number>`count(*) filter (where ${organizations.isActive} = true)`,
    }).from(organizations);

    return c.json({
      data: {
        totalUsers: userStats.total,
        verifiedUsers: userStats.verified,
        activeUsers: userStats.active,
        newUsersToday: userStats.newToday,
        newUsersThisWeek: userStats.newThisWeek,
        totalDocuments: docStats.total,
        documentsSigned: docStats.signed,
        documentsPending: docStats.pending,
        signatureCompletionRate: docStats.total > 0
          ? Math.round((docStats.signed / docStats.total) * 100)
          : 0,
        totalRevenue: revenueStats.total,
        revenueThisMonth: revenueStats.thisMonth,
        paymentSuccessRate: revenueStats.successRate,
        totalOrganizations: orgStats.total,
        activeOrganizations: orgStats.active,
      }
    });
  } catch (err: any) {
    console.error('[admin] Dashboard stats error:', err.message);
    return c.json({ error: 'Failed to fetch dashboard stats' }, 500);
  }
});

// ── Users List ──
admin.get('/users', async (c) => {
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '25');
  const search = c.req.query('search');
  const offset = (page - 1) * limit;

  try {
    const conditions = search
      ? ilike(users.email, `%${search}%`)
      : undefined;

    const [{ total }] = await db
      .select({ total: count() })
      .from(users)
      .where(conditions);

    const rows = await db
      .select()
      .from(users)
      .where(conditions)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);

    return c.json({
      data: rows,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err: any) {
    console.error('[admin] Users list error:', err.message);
    return c.json({ error: 'Failed to fetch users' }, 500);
  }
});

// ── User Detail ──
admin.get('/users/:id', async (c) => {
  const userId = c.req.param('id');
  try {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) return c.json({ error: 'User not found' }, 404);
    return c.json({ data: user });
  } catch (err: any) {
    return c.json({ error: 'Failed to fetch user' }, 500);
  }
});

// ── Suspend / Reactivate User ──
admin.patch('/users/:id', async (c) => {
  const userId = c.req.param('id');
  const body = await c.req.json();
  try {
    const [updated] = await db
      .update(users)
      .set({ isActive: body.isActive, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return c.json({ data: updated });
  } catch (err: any) {
    return c.json({ error: 'Failed to update user' }, 500);
  }
});

// ── Audit Log ──
admin.get('/audit-log', async (c) => {
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '50');
  const action = c.req.query('action');
  const offset = (page - 1) * limit;

  try {
    const conditions = action ? eq(auditLog.action, action) : undefined;

    const [{ total }] = await db.select({ total: count() }).from(auditLog).where(conditions);
    const rows = await db
      .select()
      .from(auditLog)
      .where(conditions)
      .orderBy(desc(auditLog.createdAt))
      .limit(limit)
      .offset(offset);

    return c.json({
      data: rows,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err: any) {
    return c.json({ error: 'Failed to fetch audit log' }, 500);
  }
});

// ── Revenue ──
admin.get('/revenue', async (c) => {
  try {
    const rows = await db
      .select({
        date: sql<string>`date_trunc('day', ${payments.createdAt})::date`,
        total: sql<number>`sum(${payments.amount})`,
        count: count(),
      })
      .from(payments)
      .where(eq(payments.status, 'paid'))
      .groupBy(sql`date_trunc('day', ${payments.createdAt})::date`)
      .orderBy(sql`date_trunc('day', ${payments.createdAt})::date`);

    return c.json({ data: rows });
  } catch (err: any) {
    return c.json({ error: 'Failed to fetch revenue data' }, 500);
  }
});

// ── Organizations ──
admin.get('/organizations', async (c) => {
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '25');
  const offset = (page - 1) * limit;

  try {
    const [{ total }] = await db.select({ total: count() }).from(organizations);
    const rows = await db
      .select()
      .from(organizations)
      .orderBy(desc(organizations.createdAt))
      .limit(limit)
      .offset(offset);

    return c.json({
      data: rows,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err: any) {
    return c.json({ error: 'Failed to fetch organizations' }, 500);
  }
});

// ── Feedback ──
admin.get('/feedback', async (c) => {
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '25');
  const priority = c.req.query('priority');
  const offset = (page - 1) * limit;

  try {
    const conditions = priority ? eq(feedback.priority, priority) : undefined;

    const [{ total }] = await db.select({ total: count() }).from(feedback).where(conditions);
    const rows = await db
      .select()
      .from(feedback)
      .where(conditions)
      .orderBy(desc(feedback.createdAt))
      .limit(limit)
      .offset(offset);

    return c.json({
      data: rows,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err: any) {
    return c.json({ error: 'Failed to fetch feedback' }, 500);
  }
});

// ── System Health ──
admin.get('/system/health', async (c) => {
  return c.json({
    data: {
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      nodeVersion: process.version,
      timestamp: new Date().toISOString(),
    }
  });
});

export default admin;
