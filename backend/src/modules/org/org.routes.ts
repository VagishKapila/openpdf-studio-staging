import { Hono } from 'hono';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import { db } from '../../shared/db';
import { organizations, orgMembers, documents, dailyReports, feedback } from '../../shared/db/schema';
import { eq, and, desc, count, sql } from 'drizzle-orm';

const org = new Hono();

// All org routes require authentication
org.use('/*', authMiddleware);

// ── Create Organization ──
org.post('/', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();

  try {
    const [newOrg] = await db.insert(organizations).values({
      name: body.name,
      slug: body.slug,
      ownerId: userId,
      plan: 'free',
    }).returning();

    // Add creator as owner member
    await db.insert(orgMembers).values({
      orgId: newOrg.id,
      userId,
      role: 'owner',
      joinedAt: new Date(),
    });

    return c.json({ data: newOrg }, 201);
  } catch (err: any) {
    if (err.code === '23505') {
      return c.json({ error: 'Organization slug already taken' }, 409);
    }
    return c.json({ error: 'Failed to create organization' }, 500);
  }
});

// ── Get Org Dashboard ──
org.get('/:slug/dashboard', async (c) => {
  const slug = c.req.param('slug');
  try {
    const [orgRow] = await db.select().from(organizations).where(eq(organizations.slug, slug)).limit(1);
    if (!orgRow) return c.json({ error: 'Organization not found' }, 404);

    // TODO: verify user is a member of this org

    const [docStats] = await db.select({
      total: count(),
      signed: sql<number>`count(*) filter (where ${documents.status} in ('signed', 'completed'))`,
      pending: sql<number>`count(*) filter (where ${documents.status} in ('sent', 'viewed'))`,
    }).from(documents).where(eq(documents.orgId, orgRow.id));

    return c.json({
      data: {
        organization: orgRow,
        documents: docStats,
      }
    });
  } catch (err: any) {
    return c.json({ error: 'Failed to fetch dashboard' }, 500);
  }
});

// ── Update Branding ──
org.patch('/:slug/branding', async (c) => {
  const slug = c.req.param('slug');
  const body = await c.req.json();

  try {
    const [updated] = await db
      .update(organizations)
      .set({
        logoUrl: body.logoUrl,
        primaryColor: body.primaryColor,
        secondaryColor: body.secondaryColor,
        customDomain: body.customDomain,
        emailFromName: body.emailFromName,
        footerText: body.footerText,
        updatedAt: new Date(),
      })
      .where(eq(organizations.slug, slug))
      .returning();

    return c.json({ data: updated });
  } catch (err: any) {
    return c.json({ error: 'Failed to update branding' }, 500);
  }
});

// ── List Org Members ──
org.get('/:slug/members', async (c) => {
  const slug = c.req.param('slug');
  try {
    const [orgRow] = await db.select().from(organizations).where(eq(organizations.slug, slug)).limit(1);
    if (!orgRow) return c.json({ error: 'Organization not found' }, 404);

    const members = await db.select().from(orgMembers).where(eq(orgMembers.orgId, orgRow.id));
    return c.json({ data: members });
  } catch (err: any) {
    return c.json({ error: 'Failed to fetch members' }, 500);
  }
});

// ── Invite Member ──
org.post('/:slug/members/invite', async (c) => {
  const slug = c.req.param('slug');
  const userId = c.get('userId');
  const body = await c.req.json();

  try {
    const [orgRow] = await db.select().from(organizations).where(eq(organizations.slug, slug)).limit(1);
    if (!orgRow) return c.json({ error: 'Organization not found' }, 404);

    // TODO: send invite email, create pending member
    return c.json({ message: 'Invite sent', email: body.email }, 201);
  } catch (err: any) {
    return c.json({ error: 'Failed to send invite' }, 500);
  }
});

// ── Org Analytics ──
org.get('/:slug/analytics', async (c) => {
  const slug = c.req.param('slug');
  try {
    const [orgRow] = await db.select().from(organizations).where(eq(organizations.slug, slug)).limit(1);
    if (!orgRow) return c.json({ error: 'Organization not found' }, 404);

    const reports = await db
      .select()
      .from(dailyReports)
      .where(eq(dailyReports.orgId, orgRow.id))
      .orderBy(desc(dailyReports.reportDate))
      .limit(30);

    return c.json({ data: reports });
  } catch (err: any) {
    return c.json({ error: 'Failed to fetch analytics' }, 500);
  }
});

// ── Submit Feedback ──
org.post('/:slug/feedback', async (c) => {
  const slug = c.req.param('slug');
  const userId = c.get('userId');
  const body = await c.req.json();

  try {
    const [orgRow] = await db.select().from(organizations).where(eq(organizations.slug, slug)).limit(1);
    if (!orgRow) return c.json({ error: 'Organization not found' }, 404);

    // TODO: AI triage (classify category + priority)
    const [entry] = await db.insert(feedback).values({
      orgId: orgRow.id,
      userId,
      category: body.category || 'general',
      priority: 'medium', // AI will set this
      message: body.message,
    }).returning();

    return c.json({ data: entry }, 201);
  } catch (err: any) {
    return c.json({ error: 'Failed to submit feedback' }, 500);
  }
});

export default org;
