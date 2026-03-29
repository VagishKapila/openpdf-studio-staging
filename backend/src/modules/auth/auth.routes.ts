import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { registerSchema, loginSchema, googleAuthSchema, refreshTokenSchema, updateProfileSchema } from './auth.validators';
import * as authService from './auth.service';
import { requireAuth, getUser } from '../../shared/middleware/auth';
import { db } from '../../shared/db';
import { users } from '../../shared/db/schema';

export const authRoutes = new Hono();

// POST /auth/register
authRoutes.post('/register', async (c) => {
  try {
    const body = await c.req.json();
    const input = registerSchema.parse(body);
    const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip');
    const result = await authService.register(input, ip);
    return c.json(result, 201);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return c.json({ error: 'Validation failed', details: error.issues }, 400);
    }
    if (error.message === 'Email already registered') {
      return c.json({ error: error.message }, 409);
    }
    console.error('Register error:', error);
    return c.json({ error: 'Registration failed' }, 500);
  }
});

// POST /auth/login
authRoutes.post('/login', async (c) => {
  try {
    const body = await c.req.json();
    const input = loginSchema.parse(body);
    const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip');
    const userAgent = c.req.header('user-agent');
    const result = await authService.login(input, ip, userAgent);
    return c.json(result);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return c.json({ error: 'Validation failed', details: error.issues }, 400);
    }
    if (error.message === 'Invalid email or password' || error.message === 'Account is deactivated') {
      return c.json({ error: error.message }, 401);
    }
    console.error('Login error:', error);
    return c.json({ error: 'Login failed' }, 500);
  }
});

// POST /auth/google
authRoutes.post('/google', async (c) => {
  try {
    const body = await c.req.json();
    const { idToken } = googleAuthSchema.parse(body);

    let googleData: { sub: string; email: string; name: string; picture?: string };

    // Try as ID token first (from Google One Tap)
    const tokenInfoResponse = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`
    );

    if (tokenInfoResponse.ok) {
      googleData = await tokenInfoResponse.json() as typeof googleData;
    } else {
      // Fallback: treat as access token (from popup OAuth flow)
      const userInfoResponse = await fetch(
        'https://www.googleapis.com/oauth2/v3/userinfo',
        { headers: { Authorization: `Bearer ${idToken}` } }
      );

      if (!userInfoResponse.ok) {
        return c.json({ error: 'Invalid Google token' }, 401);
      }

      const userInfo = await userInfoResponse.json() as {
        sub: string; email: string; name: string; picture?: string;
      };
      googleData = userInfo;
    }

    const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip');
    const result = await authService.googleAuth({
      email: googleData.email,
      name: googleData.name,
      googleId: googleData.sub,
      avatarUrl: googleData.picture,
    }, ip);

    return c.json(result);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return c.json({ error: 'Validation failed', details: error.issues }, 400);
    }
    console.error('Google auth error:', error);
    return c.json({ error: 'Google authentication failed' }, 500);
  }
});

// POST /auth/refresh
authRoutes.post('/refresh', async (c) => {
  try {
    const body = await c.req.json();
    const { refreshToken } = refreshTokenSchema.parse(body);
    const result = await authService.refreshAccessToken(refreshToken);
    return c.json(result);
  } catch (error: any) {
    if (error.message?.includes('Invalid') || error.message?.includes('expired')) {
      return c.json({ error: 'Invalid or expired refresh token' }, 401);
    }
    console.error('Refresh error:', error);
    return c.json({ error: 'Token refresh failed' }, 500);
  }
});

// POST /auth/logout
authRoutes.post('/logout', async (c) => {
  try {
    const body = await c.req.json();
    const { refreshToken } = refreshTokenSchema.parse(body);
    await authService.logout(refreshToken);
    return c.json({ message: 'Logged out successfully' });
  } catch {
    return c.json({ message: 'Logged out' });
  }
});

// GET /auth/me (requires auth)
authRoutes.get('/me', requireAuth, async (c) => {
  try {
    const user = getUser(c);
    const profile = await authService.getProfile(user.id);
    return c.json({ user: profile });
  } catch (error: any) {
    return c.json({ error: 'Failed to get profile' }, 500);
  }
});

// PATCH /auth/me (requires auth)
authRoutes.patch('/me', requireAuth, async (c) => {
  try {
    const user = getUser(c);
    const body = await c.req.json();
    const input = updateProfileSchema.parse(body);
    const profile = await authService.updateProfile(user.id, input);
    return c.json({ user: profile });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return c.json({ error: 'Validation failed', details: error.issues }, 400);
    }
    return c.json({ error: 'Failed to update profile' }, 500);
  }
});

// POST /auth/setup-admin — Bootstrap: promote the authenticated user to super admin
// Requires valid auth token. Promotes the requesting user.
authRoutes.post('/setup-admin', requireAuth, async (c) => {
  try {
    const user = getUser(c);

    // Promote the current user to super admin
    await db.update(users)
      .set({ isSuperAdmin: true })
      .where(eq(users.id, user.id));

    return c.json({
      message: 'You are now a super admin!',
      user: { id: user.id, email: user.email, isSuperAdmin: true }
    });
  } catch (error: any) {
    console.error('Setup admin error:', error);
    return c.json({ error: 'Failed to setup admin' }, 500);
  }
});

// POST /auth/set-password — Set a password for an authenticated user (e.g. Google OAuth accounts)
authRoutes.post('/set-password', requireAuth, async (c) => {
  try {
    const user = getUser(c);
    const body = await c.req.json();
    const { password } = body;

    if (!password || password.length < 8) {
      return c.json({ error: 'Password must be at least 8 characters' }, 400);
    }

    const bcrypt = await import('bcrypt');
    const passwordHash = await bcrypt.hash(password, 12);

    await db.update(users)
      .set({ passwordHash })
      .where(eq(users.id, user.id));

    return c.json({ message: 'Password set successfully. You can now log in with email and password.' });
  } catch (error: any) {
    console.error('Set password error:', error);
    return c.json({ error: 'Failed to set password' }, 500);
  }
});
