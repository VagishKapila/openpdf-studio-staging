import { Context, Next } from 'hono';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
}

// Middleware: require valid JWT
export async function requireAuth(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Missing or invalid authorization header' }, 401);
  }

  const token = authHeader.substring(7);

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as AuthUser;
    c.set('user', payload);
    await next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return c.json({ error: 'Token expired', code: 'TOKEN_EXPIRED' }, 401);
    }
    return c.json({ error: 'Invalid token' }, 401);
  }
}

// Middleware: optional auth (doesn't fail, just attaches user if present)
export async function optionalAuth(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');

  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      const payload = jwt.verify(token, env.JWT_SECRET) as AuthUser;
      c.set('user', payload);
    } catch {
      // Token invalid — proceed without user
    }
  }
  await next();
}

// Helper to get user from context
export function getUser(c: Context): AuthUser {
  return c.get('user') as AuthUser;
}
