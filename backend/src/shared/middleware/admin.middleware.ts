import { Context, Next } from 'hono';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

/**
 * Middleware that requires the authenticated user to be a super admin.
 * Must be used AFTER auth middleware (which sets c.get('userId')).
 */
export async function requireSuperAdmin(c: Context, next: Next) {
  const userId = c.get('userId');
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const [user] = await db
    .select({ isSuperAdmin: users.isSuperAdmin })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user || !user.isSuperAdmin) {
    return c.json({ error: 'Forbidden: Super admin access required' }, 403);
  }

  await next();
}
