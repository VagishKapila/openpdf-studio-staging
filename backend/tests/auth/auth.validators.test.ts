import { describe, it, expect } from 'vitest';
import { registerSchema, loginSchema, googleAuthSchema, refreshTokenSchema, updateProfileSchema } from '../../src/modules/auth/auth.validators';

describe('Auth Validators', () => {
  // ===== REGISTER SCHEMA =====
  describe('registerSchema', () => {
    it('accepts valid registration data', () => {
      const result = registerSchema.safeParse({
        email: 'user@example.com',
        password: 'SecurePass1',
        name: 'John Doe',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid email', () => {
      const result = registerSchema.safeParse({
        email: 'not-an-email',
        password: 'SecurePass1',
        name: 'John Doe',
      });
      expect(result.success).toBe(false);
    });

    it('rejects password under 8 characters', () => {
      const result = registerSchema.safeParse({
        email: 'user@example.com',
        password: 'Short1',
        name: 'John Doe',
      });
      expect(result.success).toBe(false);
    });

    it('rejects password without uppercase letter', () => {
      const result = registerSchema.safeParse({
        email: 'user@example.com',
        password: 'nouppercase1',
        name: 'John Doe',
      });
      expect(result.success).toBe(false);
    });

    it('rejects password without number', () => {
      const result = registerSchema.safeParse({
        email: 'user@example.com',
        password: 'NoNumberHere',
        name: 'John Doe',
      });
      expect(result.success).toBe(false);
    });

    it('rejects missing name', () => {
      const result = registerSchema.safeParse({
        email: 'user@example.com',
        password: 'SecurePass1',
      });
      expect(result.success).toBe(false);
    });

    it('rejects empty name', () => {
      const result = registerSchema.safeParse({
        email: 'user@example.com',
        password: 'SecurePass1',
        name: '',
      });
      expect(result.success).toBe(false);
    });
  });

  // ===== LOGIN SCHEMA =====
  describe('loginSchema', () => {
    it('accepts valid login data', () => {
      const result = loginSchema.safeParse({
        email: 'user@example.com',
        password: 'anypassword',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid email', () => {
      const result = loginSchema.safeParse({
        email: 'bad-email',
        password: 'anypassword',
      });
      expect(result.success).toBe(false);
    });

    it('rejects empty password', () => {
      const result = loginSchema.safeParse({
        email: 'user@example.com',
        password: '',
      });
      expect(result.success).toBe(false);
    });
  });

  // ===== GOOGLE AUTH SCHEMA =====
  describe('googleAuthSchema', () => {
    it('accepts valid Google token', () => {
      const result = googleAuthSchema.safeParse({
        idToken: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.valid-token',
      });
      expect(result.success).toBe(true);
    });

    it('rejects empty idToken', () => {
      const result = googleAuthSchema.safeParse({ idToken: '' });
      expect(result.success).toBe(false);
    });

    it('rejects missing idToken', () => {
      const result = googleAuthSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  // ===== REFRESH TOKEN SCHEMA =====
  describe('refreshTokenSchema', () => {
    it('accepts valid refresh token', () => {
      const result = refreshTokenSchema.safeParse({
        refreshToken: '550e8400-e29b-41d4-a716-446655440000',
      });
      expect(result.success).toBe(true);
    });

    it('rejects empty refresh token', () => {
      const result = refreshTokenSchema.safeParse({ refreshToken: '' });
      expect(result.success).toBe(false);
    });
  });

  // ===== UPDATE PROFILE SCHEMA =====
  describe('updateProfileSchema', () => {
    it('accepts partial update with name only', () => {
      const result = updateProfileSchema.safeParse({ name: 'New Name' });
      expect(result.success).toBe(true);
    });

    it('accepts partial update with company only', () => {
      const result = updateProfileSchema.safeParse({ companyName: 'Acme Inc' });
      expect(result.success).toBe(true);
    });

    it('accepts empty object (no changes)', () => {
      const result = updateProfileSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('rejects invalid companyLogo URL', () => {
      const result = updateProfileSchema.safeParse({
        companyLogo: 'not-a-url',
      });
      expect(result.success).toBe(false);
    });

    it('accepts valid companyLogo URL', () => {
      const result = updateProfileSchema.safeParse({
        companyLogo: 'https://example.com/logo.png',
      });
      expect(result.success).toBe(true);
    });
  });
});
