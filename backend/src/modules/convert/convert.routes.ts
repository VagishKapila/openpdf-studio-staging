import { Hono } from 'hono';
import { requireAuth, getUser } from '../../shared/middleware/auth';
import * as convertService from './convert.service';

export const convertRoutes = new Hono();

// POST /convert/upload — Upload and convert a file to PDF
convertRoutes.post('/upload', requireAuth, async (c) => {
  try {
    const user = getUser(c);
    const formData = await c.req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }

    // Check file size (50MB max)
    const MAX_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return c.json({ error: 'File too large. Maximum size is 50MB.' }, 413);
    }

    // Check format
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const mimeType = file.type || convertService.getMimeFromExtension(ext);

    if (!convertService.isSupportedFormat(mimeType) && !['docx', 'doc', 'xlsx', 'xls', 'pptx', 'ppt', 'txt', 'html', 'md', 'rtf', 'png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff', 'webp', 'pdf'].includes(ext)) {
      return c.json({
        error: 'Unsupported file format',
        supportedFormats: ['PDF', 'Word (.doc, .docx)', 'Excel (.xls, .xlsx)', 'PowerPoint (.ppt, .pptx)', 'Images (.png, .jpg, .gif, .bmp, .tiff, .webp)', 'Text (.txt, .html, .md, .rtf)'],
      }, 415);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip');

    const result = await convertService.convertToPdf(buffer, file.name, mimeType, user.id, ip);

    return c.json({
      message: 'File converted successfully',
      document: result,
    }, 201);
  } catch (error: any) {
    console.error('Convert error:', error);
    if (error.message?.includes('timed out')) {
      return c.json({ error: error.message }, 408);
    }
    return c.json({ error: 'Conversion failed: ' + error.message }, 500);
  }
});

// GET /convert/documents — List user's documents
convertRoutes.get('/documents', requireAuth, async (c) => {
  try {
    const user = getUser(c);
    const limit = parseInt(c.req.query('limit') || '50');
    const offset = parseInt(c.req.query('offset') || '0');
    const docs = await convertService.listDocuments(user.id, limit, offset);
    return c.json({ documents: docs });
  } catch (error: any) {
    return c.json({ error: 'Failed to list documents' }, 500);
  }
});

// GET /convert/documents/:id — Get single document with download URL
convertRoutes.get('/documents/:id', requireAuth, async (c) => {
  try {
    const user = getUser(c);
    const docId = c.req.param('id')!;
    const doc = await convertService.getDocument(docId, user.id);
    return c.json({ document: doc });
  } catch (error: any) {
    if (error.message === 'Document not found') {
      return c.json({ error: 'Document not found' }, 404);
    }
    return c.json({ error: 'Failed to get document' }, 500);
  }
});

// GET /convert/formats — List supported formats
convertRoutes.get('/formats', async (c) => {
  return c.json({
    formats: [
      { category: 'Documents', extensions: ['.doc', '.docx', '.rtf', '.txt', '.html', '.md'] },
      { category: 'Spreadsheets', extensions: ['.xls', '.xlsx'] },
      { category: 'Presentations', extensions: ['.ppt', '.pptx'] },
      { category: 'Images', extensions: ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff', '.webp'] },
      { category: 'PDF', extensions: ['.pdf'] },
    ],
    maxFileSize: '50MB',
  });
});
