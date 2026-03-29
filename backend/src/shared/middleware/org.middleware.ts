import { Context, Next } from 'hono';
import { db } from '../db';
import { organizations, orgMembers } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { getUser } from './auth';

const ROLE_HIERARCHY: Record<string, number> = {
  viewer: 0,
  member: 1,
  admin: 2,
  owner: 3,
};

/**
 * Factory function that returns middleware to require org membership.
 * Verifies user is a member of the org and has minimum role.
 * Sets org and orgMember on context.
 */
export function requireOrgMember(minRole: string = 'viewer') {
  return async (c: Context, next: Next) => {
    const user = getUser(c);
    const slug = c.req.param('slug');

    if (!slug) {
      return c.json({ error: 'Organization slug required' }, 400);
    }

    try {
      const [org] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.slug, slug))
        .limit(1);

      if (!org) {
        return c.json({ error: 'Organization not found' }, 404);
      }

      if (!org.isActive) {
        return c.json({ error: 'Organization is deactivated' }, 403);
      }

      const [member] = await db
        .select()
        .from(orgMembers)
        .where(and(eq(orgMembers.orgId, org.id), eq(orgMembers.userId, user.id)))
        .limit(1);

      if (!member) {
        return c.json({ error: 'You are not a member of this organization' }, 403);
      }

      const userLevel = ROLE_HIERARCHY[member.role] ?? 0;
      const requiredLevel = ROLE_HIERARCHY[minRole] ?? 0;

      if (userLevel < requiredLevel) {
        return c.json(
          { error: `Requires ${minRole} role or higher` },
          403
        );
      }

      c.set('org', org);
      c.set('orgMember', member);
      await next();
    } catch (err: any) {
      console.error('[org.middleware] Error:', err.message);
      return c.json({ error: 'Failed to verify organization membership' }, 500);
    }
  };
}

/**
 * Helper to get organization from context.
 * Should only be called after requireOrgMember middleware.
 */
export function getOrg(c: Context) {
  return c.get('org') as typeof organizations.$inferSelect;
}

/**
 * Helper to get org member info from context.
 * Should only be called after requireOrgMember middleware.
 */
export function getOrgMember(c: Context) {
  return c.get('orgMember') as typeof orgMembers.$inferSelect;
}
