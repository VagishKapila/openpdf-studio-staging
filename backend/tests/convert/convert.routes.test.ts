import { describe, it, expect, vi, beforeEach } from 'vitest';
import app from '../../src/app';

// Mock all external dependencies
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
  getUploadUrl: vi.fn().mockResolvedValue('https://s3.example.com/upload'),
  deleteFromS3: vi.fn().mockResolvedValue(undefined),
  getFromS3: vi.fn().mockResolvedValue(Buffer.from('test')),
}));

vi.mock('../../src/modules/auth/auth.service', () => ({
  register: vi.fn(),
  login: vi.fn(),
  googleAuth: vi.fn(),
  refreshAccessToken: vi.fn(),
  logout: vi.fn(),
  getProfile: vi.fn(),
  updateProfile: vi.fn(),
}));

describe('Convert Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ===== GET /convert/formats (public) =====
  describe('GET /convert/formats', () => {
    it('returns list of supported formats', async () => {
      const res = await app.request('/convert/formats');
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.formats).toBeDefined();
      expect(data.formats.length).toBeGreaterThan(0);
      expect(data.maxFileSize).toBe('50MB');

      // Check that all expected categories exist
      const categories = data.formats.map((f: any) => f.category);
      expect(categories).toContain('Documents');
      expect(categories).toContain('Spreadsheets');
      expect(categories).toContain('Presentations');
      expect(categories).toContain('Images');
      expect(categories).toContain('PDF');
    });

    it('includes common extensions in each category', async () => {
      const res = await app.request('/convert/formats');
      const data = await res.json();

      const docs = data.formats.find((f: any) => f.category === 'Documents');
      expect(docs.extensions).toContain('.docx');
      expect(docs.extensions).toContain('.txt');

      const images = data.formats.find((f: any) => f.category === 'Images');
      expect(images.extensions).toContain('.png');
      expect(images.extensions).toContain('.jpg');
    });
  });

  // ===== POST /convert/upload (requires auth) =====
  describe('POST /convert/upload', () => {
    it('returns 401 without auth token', async () => {
      const formData = new FormData();
      formData.append('file', new Blob(['hello'], { type: 'text/plain' }), 'test.txt');

      const res = await app.request('/convert/upload', {
        method: 'POST',
        body: formData,
      });

      expect(res.status).toBe(401);
    });
  });

  // ===== GET /convert/documents (requires auth) =====
  describe('GET /convert/documents', () => {
    it('returns 401 without auth token', async () => {
      const res = await app.request('/convert/documents');
      expect(res.status).toBe(401);
    });
  });

  // ===== GET /convert/documents/:id (requires auth) =====
  describe('GET /convert/documents/:id', () => {
    it('returns 401 without auth token', async () => {
      const res = await app.request('/convert/documents/some-id');
      expect(res.status).toBe(401);
    });
  });
});
