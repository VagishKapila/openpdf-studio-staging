import { Context, Next } from 'hono';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

/**
 * Middleware that requires the authenticated user to be a super admin.
 * Must be used AFTER requireAuth middleware (which sets c.get('user')).
 */
export async function requireSuperAdmin(c: Context, next: Next) {
  const authUser = c.get('user');
  if (!authUser?.id) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const [user] = await db
    .select({ isSuperAdmin: users.isSuperAdmin })
    .from(users)
    .where(eq(users.id, authUser.id))
    .limit(1);

  if (!user || !user.isSuperAdmin) {
    return c.json({ error: 'Forbidden: Super admin access required' }, 403);
  }

  await next();
}
