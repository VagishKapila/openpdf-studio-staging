import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../../shared/db';
import { users, sessions } from '../../shared/db/schema';
import { env } from '../../config/env';
import { logAudit } from '../../shared/utils/audit';
import type { RegisterInput, LoginInput, UpdateProfileInput } from './auth.validators';

const SALT_ROUNDS = 12;
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '30d';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface UserResponse {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  companyName: string | null;
  emailVerified: boolean;
}

// Generate JWT access + refresh tokens
function generateTokens(user: { id: string; email: string; name: string | null }): TokenPair {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
  const refreshToken = uuidv4();
  return { accessToken, refreshToken };
}

function formatUser(user: typeof users.$inferSelect): UserResponse {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    companyName: user.companyName,
    emailVerified: user.emailVerified,
  };
}

// ===== REGISTER =====
export async function register(input: RegisterInput, ip?: string) {
  // Check if email already exists
  const existing = await db.select().from(users).where(eq(users.email, input.email.toLowerCase())).limit(1);
  if (existing.length > 0) {
    throw new Error('Email already registered');
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  const [user] = await db.insert(users).values({
    email: input.email.toLowerCase(),
    passwordHash,
    name: input.name,
    emailVerified: false,
  }).returning();

  const tokens = generateTokens(user);

  // Store refresh token
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);
  await db.insert(sessions).values({
    userId: user.id,
    refreshToken: tokens.refreshToken,
    ipAddress: ip,
    expiresAt,
  });

  await logAudit({
    userId: user.id,
    action: 'auth.register',
    actorEmail: user.email,
    ipAddress: ip,
  });

  return { user: formatUser(user), tokens };
}

// ===== LOGIN =====
export async function login(input: LoginInput, ip?: string, userAgent?: string) {
  const [user] = await db.select().from(users).where(eq(users.email, input.email.toLowerCase())).limit(1);

  if (!user || !user.passwordHash) {
    throw new Error('Invalid email or password');
  }

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) {
    throw new Error('Invalid email or password');
  }

  if (!user.isActive) {
    throw new Error('Account is deactivated');
  }

  const tokens = generateTokens(user);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);
  await db.insert(sessions).values({
    userId: user.id,
    refreshToken: tokens.refreshToken,
    ipAddress: ip,
    userAgent,
    expiresAt,
  });

  await logAudit({
    userId: user.id,
    action: 'auth.login',
    actorEmail: user.email,
    ipAddress: ip,
  });

  return { user: formatUser(user), tokens };
}

// ===== GOOGLE AUTH =====
export async function googleAuth(googleProfile: { email: string; name: string; googleId: string; avatarUrl?: string }, ip?: string) {
  // Check if user exists by Google ID or email
  let [user] = await db.select().from(users).where(eq(users.googleId, googleProfile.googleId)).limit(1);

  if (!user) {
    // Check by email (might have registered with email first)
    [user] = await db.select().from(users).where(eq(users.email, googleProfile.email.toLowerCase())).limit(1);

    if (user) {
      // Link Google account to existing user
      [user] = await db.update(users)
        .set({ googleId: googleProfile.googleId, avatarUrl: googleProfile.avatarUrl, emailVerified: true })
        .where(eq(users.id, user.id))
        .returning();
    } else {
      // Create new user
      [user] = await db.insert(users).values({
        email: googleProfile.email.toLowerCase(),
        name: googleProfile.name,
        googleId: googleProfile.googleId,
        avatarUrl: googleProfile.avatarUrl,
        emailVerified: true,
      }).returning();
    }
  }

  const tokens = generateTokens(user);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);
  await db.insert(sessions).values({
    userId: user.id,
    refreshToken: tokens.refreshToken,
    ipAddress: ip,
    expiresAt,
  });

  await logAudit({
    userId: user.id,
    action: 'auth.google_login',
    actorEmail: user.email,
    ipAddress: ip,
  });

  return { user: formatUser(user), tokens };
}

// ===== REFRESH TOKEN =====
export async function refreshAccessToken(refreshToken: string) {
  const [session] = await db.select().from(sessions).where(eq(sessions.refreshToken, refreshToken)).limit(1);

  if (!session || session.expiresAt < new Date()) {
    throw new Error('Invalid or expired refresh token');
  }

  const [user] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
  if (!user || !user.isActive) {
    throw new Error('User not found or deactivated');
  }

  // Rotate refresh token (invalidate old, create new)
  await db.delete(sessions).where(eq(sessions.id, session.id));

  const tokens = generateTokens(user);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);
  await db.insert(sessions).values({
    userId: user.id,
    refreshToken: tokens.refreshToken,
    expiresAt,
  });

  return { user: formatUser(user), tokens };
}

// ===== LOGOUT =====
export async function logout(refreshToken: string) {
  await db.delete(sessions).where(eq(sessions.refreshToken, refreshToken));
}

// ===== GET PROFILE =====
export async function getProfile(userId: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw new Error('User not found');
  return formatUser(user);
}

// ===== UPDATE PROFILE =====
export async function updateProfile(userId: string, input: UpdateProfileInput) {
  const [user] = await db.update(users)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning();
  if (!user) throw new Error('User not found');
  return formatUser(user);
}
