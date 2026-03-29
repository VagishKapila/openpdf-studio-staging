import { Hono } from 'hono';
import { requireAuth, getUser } from '../../shared/middleware/auth';
import { requireOrgMember, getOrg, getOrgMember } from '../../shared/middleware/org.middleware';
import { db } from '../../shared/db';
import {
  organizations,
  orgMembers,
  documents,
  payments,
  dailyReports,
  feedback,
  signatureRequests,
  users,
  notificationInbox,
} from '../../shared/db/schema';
import { eq, and, desc, count, sql, inArray } from 'drizzle-orm';

const org = new Hono();

// All org routes require authentication
org.use('/*', requireAuth);

// ── Create Organization ──
org.post('/', async (c) => {
  const userId = getUser(c).id;
  const body = await c.req.json();

  if (!body.name || !body.slug) {
    return c.json({ error: 'Name and slug are required' }, 400);
  }

  // Validate slug format
  if (!/^[a-z0-9-]+$/.test(body.slug)) {
    return c.json({ error: 'Slug must be lowercase alphanumeric with hyphens only' }, 400);
  }

  try {
    const [newOrg] = await db
      .insert(organizations)
      .values({
        name: body.name,
        slug: body.slug,
        ownerId: userId,
        plan: 'free',
      })
      .returning();

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

// ── List User's Organizations ──
org.get('/', async (c) => {
  const userId = getUser(c).id;
  try {
    const memberships = await db
      .select({
        org: organizations,
        role: orgMembers.role,
        joinedAt: orgMembers.joinedAt,
      })
      .from(orgMembers)
      .innerJoin(organizations, eq(organizations.id, orgMembers.orgId))
      .where(eq(orgMembers.userId, userId))
      .orderBy(desc(orgMembers.joinedAt));

    return c.json({ data: memberships });
  } catch (err: any) {
    console.error('[org] List orgs error:', err.message);
    return c.json({ error: 'Failed to fetch organizations' }, 500);
  }
});

// ── Get Org Details ──
org.get('/:slug', requireOrgMember('viewer'), async (c) => {
  const orgRow = getOrg(c);
  const member = getOrgMember(c);
  return c.json({ data: { ...orgRow, currentUserRole: member.role } });
});

// ── Get Org Dashboard (role-based) ──
org.get('/:slug/dashboard', requireOrgMember('viewer'), async (c) => {
  const orgRow = getOrg(c);
  const member = getOrgMember(c);

  try {
    const [docStats] = await db
      .select({
        total: count(),
        signed: sql<number>`count(*) filter (where ${documents.status} in ('signed', 'completed'))`,
        pending: sql<number>`count(*) filter (where ${documents.status} in ('sent', 'viewed'))`,
        draft: sql<number>`count(*) filter (where ${documents.status} = 'draft')`,
      })
      .from(documents)
      .where(eq(documents.orgId, orgRow.id));

    const [memberCount] = await db
      .select({ total: count() })
      .from(orgMembers)
      .where(eq(orgMembers.orgId, orgRow.id));

    const [revenueStats] = await db
      .select({
        total: sql<number>`coalesce(sum(${payments.amount}), 0)`,
        thisMonth: sql<number>`coalesce(sum(${payments.amount}) filter (where ${payments.createdAt} >= date_trunc('month', current_date)), 0)`,
      })
      .from(payments)
      .where(eq(payments.orgId, orgRow.id));

    // Viewers get limited stats
    const data: Record<string, unknown> = {
      organization: orgRow,
      currentUserRole: member.role,
      documents: docStats,
      memberCount: memberCount.total,
    };

    // Only admin+ see revenue
    if (['admin', 'owner'].includes(member.role)) {
      data.revenue = revenueStats;
    }

    return c.json({ data });
  } catch (err: any) {
    console.error('[org] Dashboard error:', err.message);
    return c.json({ error: 'Failed to fetch dashboard' }, 500);
  }
});

// ── Update Branding (admin+) ──
org.patch('/:slug/branding', requireOrgMember('admin'), async (c) => {
  const orgRow = getOrg(c);
  const body = await c.req.json();

  try {
    const [updated] = await db
      .update(organizations)
      .set({
        logoUrl: body.logoUrl ?? orgRow.logoUrl,
        primaryColor: body.primaryColor ?? orgRow.primaryColor,
        secondaryColor: body.secondaryColor ?? orgRow.secondaryColor,
        customDomain: body.customDomain ?? orgRow.customDomain,
        emailFromName: body.emailFromName ?? orgRow.emailFromName,
        footerText: body.footerText ?? orgRow.footerText,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, orgRow.id))
      .returning();

    return c.json({ data: updated });
  } catch (err: any) {
    console.error('[org] Update branding error:', err.message);
    return c.json({ error: 'Failed to update branding' }, 500);
  }
});

// ── Update Org Settings (owner only) ──
org.patch('/:slug/settings', requireOrgMember('owner'), async (c) => {
  const orgRow = getOrg(c);
  const body = await c.req.json();

  try {
    const [updated] = await db
      .update(organizations)
      .set({
        name: body.name ?? orgRow.name,
        plan: body.plan ?? orgRow.plan,
        settings: body.settings ?? orgRow.settings,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, orgRow.id))
      .returning();

    return c.json({ data: updated });
  } catch (err: any) {
    console.error('[org] Update settings error:', err.message);
    return c.json({ error: 'Failed to update settings' }, 500);
  }
});

// ── List Org Members ──
org.get('/:slug/members', requireOrgMember('viewer'), async (c) => {
  const orgRow = getOrg(c);
  try {
    const members = await db
      .select({
        id: orgMembers.id,
        userId: orgMembers.userId,
        role: orgMembers.role,
        joinedAt: orgMembers.joinedAt,
        createdAt: orgMembers.createdAt,
        userName: users.name,
        userEmail: users.email,
        userAvatar: users.avatarUrl,
      })
      .from(orgMembers)
      .innerJoin(users, eq(users.id, orgMembers.userId))
      .where(eq(orgMembers.orgId, orgRow.id))
      .orderBy(orgMembers.createdAt);

    return c.json({ data: members });
  } catch (err: any) {
    console.error('[org] List members error:', err.message);
    return c.json({ error: 'Failed to fetch members' }, 500);
  }
});

// ── Invite Member (admin+) ──
org.post('/:slug/members/invite', requireOrgMember('admin'), async (c) => {
  const orgRow = getOrg(c);
  const inviter = getUser(c);
  const body = await c.req.json();

  if (!body.email) {
    return c.json({ error: 'Email is required' }, 400);
  }

  const role = body.role || 'member';
  if (!['admin', 'member', 'viewer'].includes(role)) {
    return c.json({ error: 'Invalid role. Must be admin, member, or viewer' }, 400);
  }

  try {
    // Check if user exists
    let [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, body.email))
      .limit(1);

    if (!existingUser) {
      // Create placeholder user (they'll set password on first login)
      [existingUser] = await db
        .insert(users)
        .values({
          email: body.email,
          name: body.name || null,
          emailVerified: false,
        })
        .returning();
    }

    // Check if already a member
    const [existingMember] = await db
      .select()
      .from(orgMembers)
      .where(and(eq(orgMembers.orgId, orgRow.id), eq(orgMembers.userId, existingUser.id)))
      .limit(1);

    if (existingMember) {
      return c.json({ error: 'User is already a member of this organization' }, 409);
    }

    const [member] = await db
      .insert(orgMembers)
      .values({
        orgId: orgRow.id,
        userId: existingUser.id,
        role,
        invitedBy: inviter.id,
        joinedAt: new Date(),
      })
      .returning();

    // Create notification for the invited user
    await db.insert(notificationInbox).values({
      userId: existingUser.id,
      orgId: orgRow.id,
      type: 'system.alert',
      title: 'Organization Invitation',
      message: `You've been added to ${orgRow.name} as ${role}`,
      data: { orgSlug: orgRow.slug, role },
    });

    return c.json(
      {
        data: {
          member,
          user: { id: existingUser.id, email: existingUser.email, name: existingUser.name },
        },
      },
      201
    );
  } catch (err: any) {
    console.error('[org] Invite member error:', err.message);
    return c.json({ error: 'Failed to invite member' }, 500);
  }
});

// ── Update Member Role (admin+, cannot change owner) ──
org.patch('/:slug/members/:userId', requireOrgMember('admin'), async (c) => {
  const orgRow = getOrg(c);
  const targetUserId = c.req.param('userId')!;
  const currentMember = getOrgMember(c);
  const body = await c.req.json();

  if (!body.role || !['admin', 'member', 'viewer'].includes(body.role)) {
    return c.json({ error: 'Valid role required (admin, member, viewer)' }, 400);
  }

  try {
    const [targetMember] = await db
      .select()
      .from(orgMembers)
      .where(and(eq(orgMembers.orgId, orgRow.id), eq(orgMembers.userId, targetUserId)))
      .limit(1);

    if (!targetMember) {
      return c.json({ error: 'Member not found' }, 404);
    }

    // Cannot change owner's role (only owner can transfer ownership)
    if (targetMember.role === 'owner') {
      return c.json({ error: "Cannot change the owner's role" }, 403);
    }

    // Admins can't promote to admin (only owners can)
    if (body.role === 'admin' && currentMember.role !== 'owner') {
      return c.json({ error: 'Only the owner can promote to admin' }, 403);
    }

    const [updated] = await db
      .update(orgMembers)
      .set({ role: body.role })
      .where(eq(orgMembers.id, targetMember.id))
      .returning();

    return c.json({ data: updated });
  } catch (err: any) {
    console.error('[org] Update member role error:', err.message);
    return c.json({ error: 'Failed to update member role' }, 500);
  }
});

// ── Remove Member (admin+, cannot remove owner) ──
org.delete('/:slug/members/:userId', requireOrgMember('admin'), async (c) => {
  const orgRow = getOrg(c);
  const targetUserId = c.req.param('userId')!;

  try {
    const [targetMember] = await db
      .select()
      .from(orgMembers)
      .where(and(eq(orgMembers.orgId, orgRow.id), eq(orgMembers.userId, targetUserId)))
      .limit(1);

    if (!targetMember) {
      return c.json({ error: 'Member not found' }, 404);
    }

    if (targetMember.role === 'owner') {
      return c.json({ error: 'Cannot remove the owner' }, 403);
    }

    await db.delete(orgMembers).where(eq(orgMembers.id, targetMember.id));
    return c.json({ message: 'Member removed' });
  } catch (err: any) {
    console.error('[org] Remove member error:', err.message);
    return c.json({ error: 'Failed to remove member' }, 500);
  }
});

// ── Org Documents (role-based) ──
org.get('/:slug/documents', requireOrgMember('viewer'), async (c) => {
  const orgRow = getOrg(c);
  const member = getOrgMember(c);
  const userId = getUser(c).id;
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '25');
  const status = c.req.query('status');
  const offset = (page - 1) * limit;

  try {
    // Viewers only see docs assigned to them, members+ see all org docs
    const baseCondition = eq(documents.orgId, orgRow.id);
    const conditions =
      member.role === 'viewer'
        ? and(baseCondition, eq(documents.userId, userId))
        : baseCondition;

    const statusCondition = status ? and(conditions, eq(documents.status, status)) : conditions;

    const [{ total }] = await db
      .select({ total: count() })
      .from(documents)
      .where(statusCondition);
    const rows = await db
      .select()
      .from(documents)
      .where(statusCondition)
      .orderBy(desc(documents.createdAt))
      .limit(limit)
      .offset(offset);

    return c.json({
      data: rows,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err: any) {
    console.error('[org] Get documents error:', err.message);
    return c.json({ error: 'Failed to fetch documents' }, 500);
  }
});

// ── Org Analytics (admin+) ──
org.get('/:slug/analytics', requireOrgMember('admin'), async (c) => {
  const orgRow = getOrg(c);
  try {
    const reports = await db
      .select()
      .from(dailyReports)
      .where(eq(dailyReports.orgId, orgRow.id))
      .orderBy(desc(dailyReports.reportDate))
      .limit(30);

    return c.json({ data: reports });
  } catch (err: any) {
    console.error('[org] Get analytics error:', err.message);
    return c.json({ error: 'Failed to fetch analytics' }, 500);
  }
});

// ── Org Notifications ──
org.get('/:slug/notifications', requireOrgMember('viewer'), async (c) => {
  const orgRow = getOrg(c);
  const userId = getUser(c).id;
  const limit = parseInt(c.req.query('limit') || '20');
  const unreadOnly = c.req.query('unread') === 'true';

  try {
    const baseCondition = and(
      eq(notificationInbox.userId, userId),
      eq(notificationInbox.orgId, orgRow.id)
    );
    const conditions = unreadOnly ? and(baseCondition, eq(notificationInbox.read, false)) : baseCondition;

    const rows = await db
      .select()
      .from(notificationInbox)
      .where(conditions)
      .orderBy(desc(notificationInbox.createdAt))
      .limit(limit);

    return c.json({ data: rows });
  } catch (err: any) {
    console.error('[org] Get notifications error:', err.message);
    return c.json({ error: 'Failed to fetch notifications' }, 500);
  }
});

// ── Mark Notification Read ──
org.patch('/:slug/notifications/:notifId/read', requireOrgMember('viewer'), async (c) => {
  const notifId = c.req.param('notifId')!;
  const userId = getUser(c).id;

  try {
    await db
      .update(notificationInbox)
      .set({ read: true })
      .where(and(eq(notificationInbox.id, notifId), eq(notificationInbox.userId, userId)));

    return c.json({ message: 'Marked as read' });
  } catch (err: any) {
    console.error('[org] Mark notification error:', err.message);
    return c.json({ error: 'Failed to mark notification' }, 500);
  }
});

// ── Submit Feedback ──
org.post('/:slug/feedback', requireOrgMember('member'), async (c) => {
  const orgRow = getOrg(c);
  const userId = getUser(c).id;
  const body = await c.req.json();

  if (!body.message) {
    return c.json({ error: 'Message is required' }, 400);
  }

  try {
    const [entry] = await db
      .insert(feedback)
      .values({
        orgId: orgRow.id,
        userId,
        category: body.category || 'general',
        priority: 'medium',
        message: body.message,
      })
      .returning();

    return c.json({ data: entry }, 201);
  } catch (err: any) {
    console.error('[org] Submit feedback error:', err.message);
    return c.json({ error: 'Failed to submit feedback' }, 500);
  }
});

export default org;
