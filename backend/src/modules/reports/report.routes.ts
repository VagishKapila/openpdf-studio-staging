import { Hono } from 'hono';
import { requireAuth } from '../../shared/middleware/auth';
import { requireSuperAdmin } from '../../shared/middleware/admin.middleware';
import { generateAllOrgReports, generateDailyReport, sendDailyDigestEmail, sendWeeklyDigestEmail } from './report.service';
import { db } from '../../shared/db';
import { dailyReports } from '../../shared/db/schema';
import { eq, and, gte, lt, desc } from 'drizzle-orm';

const reports = new Hono();
reports.use('/*', requireAuth);

// ââ Generate Today's Reports for All Orgs (admin only) ââ
reports.post('/generate', requireSuperAdmin, async (c) => {
  try {
    const result = await generateAllOrgReports();
    return c.json({ data: result }, 201);
  } catch (err: any) {
    return c.json({ error: 'Failed to generate reports' }, 500);
  }
});

// ââ Get Reports for an Organization (paginated with date range) ââ
reports.get('/org/:orgId', async (c) => {
  const orgId = c.req.param('orgId')!;
  const page = parseInt(c.req.query('page') || '0');
  const limit = parseInt(c.req.query('limit') || '30');
  const startDate = c.req.query('startDate');
  const endDate = c.req.query('endDate');

  try {
    let whereConditions = eq(dailyReports.orgId, orgId);

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      whereConditions = and(
        whereConditions,
        gte(dailyReports.reportDate, start),
        lt(dailyReports.reportDate, end),
      ) as any;
    }

    const rows = await db
      .select()
      .from(dailyReports)
      .where(whereConditions)
      .orderBy(desc(dailyReports.reportDate))
      .limit(limit)
      .offset(page * limit);

    const countResult = await db
      .select({ count: dailyReports.id })
      .from(dailyReports)
      .where(whereConditions);

    const total = countResult.length;

    return c.json({
      data: rows,
      pagination: { page, limit, total },
    });
  } catch (err: any) {
    return c.json({ error: 'Failed to fetch reports' }, 500);
  }
});

// ââ Get Most Recent Report for an Org ââ
reports.get('/latest/:orgId', async (c) => {
  const orgId = c.req.param('orgId')!;

  try {
    const [report] = await db
      .select()
      .from(dailyReports)
      .where(eq(dailyReports.orgId, orgId))
      .orderBy(desc(dailyReports.reportDate))
      .limit(1);

    if (!report) {
      return c.json({ error: 'No reports found for this organization' }, 404);
    }

    return c.json({ data: report });
  } catch (err: any) {
    return c.json({ error: 'Failed to fetch report' }, 500);
  }
});

// ââ Send Daily Digest Email (admin only) ââ
reports.post('/send-daily-digest', requireSuperAdmin, async (c) => {
  try {
    const body = await c.req.json();
    const { orgId, reportDate } = body;

    if (!orgId) {
      return c.json({ error: 'orgId is required' }, 400);
    }

    const date = reportDate ? new Date(reportDate) : new Date();
    const result = await sendDailyDigestEmail(orgId, date);

    if (!result) {
      return c.json({ error: 'Failed to send daily digest email' }, 500);
    }

    return c.json({ data: result }, 201);
  } catch (err: any) {
    console.error('[reports] Error sending daily digest:', err);
    return c.json({ error: 'Failed to send daily digest emails' }, 500);
  }
});

// ââ Send Weekly Digest Email (admin only) ââ
reports.post('/send-weekly-digest', requireSuperAdmin, async (c) => {
  try {
    const body = await c.req.json();
    const { orgId, endDate } = body;

    if (!orgId) {
      return c.json({ error: 'orgId is required' }, 400);
    }

    const date = endDate ? new Date(endDate) : new Date();
    const result = await sendWeeklyDigestEmail(orgId, date);

    if (!result) {
      return c.json({ error: 'Failed to send weekly digest email' }, 500);
    }

    return c.json({ data: result }, 201);
  } catch (err: any) {
    console.error('[reports] Error sending weekly digest:', err);
    return c.json({ error: 'Failed to send weekly digest emails' }, 500);
  }
});

export default reports;
