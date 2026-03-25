import { describe, it, expect, vi, beforeEach } from 'vitest';
import app from '../../src/app';

// Mock the database, audit, and auth service at module level
vi.mock('../../src/shared/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../../src/shared/utils/audit', () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../src/shared/utils/s3', () => ({
  uploadToS3: vi.fn().mockResolvedValue('s3://test'),
  getDownloadUrl: vi.fn().mockResolvedValue('https://s3.example.com/file'),
  generateS3Key: vi.fn().mockReturnValue('test-key'),
}));

// Mock the auth service entirely for route-level tests
vi.mock('../../src/modules/auth/auth.service', () => ({
  register: vi.fn(),
  login: vi.fn(),
  googleAuth: vi.fn(),
  refreshAccessToken: vi.fn(),
  logout: vi.fn(),
  getProfile: vi.fn(),
  updateProfile: vi.fn(),
}));

import * as authService from '../../src/modules/auth/auth.service';

describe('Auth Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ===== POST /auth/register =====
  describe('POST /auth/register', () => {
    it('returns 201 on successful registration', async () => {
      const mockResult = {
        user: { id: '1', email: 'test@example.com', name: 'Test', avatarUrl: null, companyName: null, emailVerified: false },
        tokens: { accessToken: 'jwt-token', refreshToken: 'refresh-token' },
      };
      vi.mocked(authService.register).mockResolvedValue(mockResult);

      const res = await app.request('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'SecurePass1',
          name: 'Test User',
        }),
      });

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.user.email).toBe('test@example.com');
      expect(data.tokens.accessToken).toBeDefined();
    });

    it('returns 400 on validation failure', async () => {
      const res = await app.request('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'bad-email',
          password: 'short',
          name: '',
        }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('Validation failed');
    });

    it('returns 409 if email already exists', async () => {
      vi.mocked(authService.register).mockRejectedValue(new Error('Email already registered'));

      const res = await app.request('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'existing@example.com',
          password: 'SecurePass1',
          name: 'Test',
        }),
      });

      expect(res.status).toBe(409);
    });
  });

  // ===== POST /auth/login =====
  describe('POST /auth/login', () => {
    it('returns 200 on successful login', async () => {
      const mockResult = {
        user: { id: '1', email: 'test@example.com', name: 'Test', avatarUrl: null, companyName: null, emailVerified: true },
        tokens: { accessToken: 'jwt-token', refreshToken: 'refresh-token' },
      };
      vi.mocked(authService.login).mockResolvedValue(mockResult);

      const res = await app.request('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'SecurePass1',
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.tokens).toBeDefined();
    });

    it('returns 401 on invalid credentials', async () => {
      vi.mocked(authService.login).mockRejectedValue(new Error('Invalid email or password'));

      const res = await app.request('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'WrongPass1',
        }),
      });

      expect(res.status).toBe(401);
    });

    it('returns 401 on deactivated account', async () => {
      vi.mocked(authService.login).mockRejectedValue(new Error('Account is deactivated'));

      const res = await app.request('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'SecurePass1',
        }),
      });

      expect(res.status).toBe(401);
    });
  });

  // ===== POST /auth/refresh =====
  describe('POST /auth/refresh', () => {
    it('returns new tokens on valid refresh', async () => {
      const mockResult = {
        user: { id: '1', email: 'test@example.com', name: 'Test', avatarUrl: null, companyName: null, emailVerified: true },
        tokens: { accessToken: 'new-jwt', refreshToken: 'new-refresh' },
      };
      vi.mocked(authService.refreshAccessToken).mockResolvedValue(mockResult);

      const res = await app.request('/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: 'valid-refresh-token' }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.tokens.accessToken).toBe('new-jwt');
    });

    it('returns 401 on expired refresh token', async () => {
      vi.mocked(authService.refreshAccessToken).mockRejectedValue(new Error('Invalid or expired refresh token'));

      const res = await app.request('/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: 'expired-token' }),
      });

      expect(res.status).toBe(401);
    });
  });

  // ===== POST /auth/logout =====
  describe('POST /auth/logout', () => {
    it('returns success on logout', async () => {
      vi.mocked(authService.logout).mockResolvedValue(undefined);

      const res = await app.request('/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: 'some-token' }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.message).toContain('Logged out');
    });
  });

  // ===== GET /auth/me =====
  describe('GET /auth/me', () => {
    it('returns 401 without auth token', async () => {
      const res = await app.request('/auth/me');
      expect(res.status).toBe(401);
    });
  });

  // ===== Health & 404 =====
  describe('App-level routes', () => {
    it('returns healthy status on /', async () => {
      const res = await app.request('/');
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.status).toBe('healthy');
      expect(data.modules).toContain('auth');
      expect(data.modules).toContain('convert');
    });

    it('returns ok on /health', async () => {
      const res = await app.request('/health');
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.status).toBe('ok');
    });

    it('returns 404 for unknown routes', async () => {
      const res = await app.request('/nonexistent');
      expect(res.status).toBe(404);
    });
  });
});
