import { Hono } from 'hono';
import { authMiddleware } from '../../shared/middleware/auth';
import {
  prepareDocument,
  saveDetectedFields,
  getSignatureRequest,
  signDocument,
  saveSignedDocument,
  detectFieldsFromText,
  type DetectedField,
} from './esign.service';

const esignRoutes = new Hono();

// All esign routes require authentication
esignRoutes.use('*', authMiddleware);

// ===== PREPARE DOCUMENT FOR SIGNING =====
// POST /esign/prepare
// Uploads a document and creates a signature request
esignRoutes.post('/prepare', async (c) => {
  try {
    const userId = c.get('userId') as string;
    const body = await c.req.parseBody();
    const file = body['file'] as File;

    if (!file) {
      return c.json({ error: 'No file uploaded' }, 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const result = await prepareDocument({
      userId,
      file: {
        buffer,
        fileName: file.name,
        mimeType: file.type || 'application/pdf',
        size: file.size,
      },
    });

    return c.json({
      success: true,
      documentId: result.document.id,
      requestId: result.request.id,
      accessToken: result.request.accessToken,
      downloadUrl: result.downloadUrl,
    });
  } catch (error: any) {
    console.error('Prepare document error:', error);
    return c.json({ error: error.message || 'Failed to prepare document' }, 500);
  }
});

// ===== SAVE DETECTED FIELDS =====
// POST /esign/:requestId/fields
// Client sends detected fields after analyzing the PDF
esignRoutes.post('/:requestId/fields', async (c) => {
  try {
    const requestId = c.req.param('requestId');
    const { fields } = await c.req.json<{ fields: DetectedField[] }>();

    if (!fields || !Array.isArray(fields)) {
      return c.json({ error: 'Fields array is required' }, 400);
    }

    const savedFields = await saveDetectedFields(requestId, fields);

    return c.json({
      success: true,
      fieldCount: savedFields.length,
      fields: savedFields,
    });
  } catch (error: any) {
    console.error('Save fields error:', error);
    return c.json({ error: error.message || 'Failed to save fields' }, 500);
  }
});

// ===== GET SIGNATURE REQUEST =====
// GET /esign/:requestId
esignRoutes.get('/:requestId', async (c) => {
  try {
    const requestId = c.req.param('requestId');
    const result = await getSignatureRequest(requestId);

    if (!result) {
      return c.json({ error: 'Signature request not found' }, 404);
    }

    return c.json(result);
  } catch (error: any) {
    console.error('Get request error:', error);
    return c.json({ error: error.message || 'Failed to get request' }, 500);
  }
});

// ===== SUBMIT SIGNATURES =====
// POST /esign/:requestId/sign
esignRoutes.post('/:requestId/sign', async (c) => {
  try {
    const requestId = c.req.param('requestId');
    const body = await c.req.json();

    const result = await signDocument({
      requestId,
      signerEmail: body.signerEmail,
      signerName: body.signerName,
      fields: body.fields || [],
      ipAddress: c.req.header('x-forwarded-for') || 'unknown',
      userAgent: c.req.header('user-agent') || 'unknown',
    });

    return c.json(result);
  } catch (error: any) {
    console.error('Sign document error:', error);
    return c.json({ error: error.message || 'Failed to sign document' }, 500);
  }
});

// ===== UPLOAD SIGNED (FLATTENED) PDF =====
// POST /esign/:requestId/finalize
esignRoutes.post('/:requestId/finalize', async (c) => {
  try {
    const requestId = c.req.param('requestId');
    const userId = c.get('userId') as string;
    const body = await c.req.parseBody();
    const file = body['file'] as File;

    if (!file) {
      return c.json({ error: 'No signed PDF uploaded' }, 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await saveSignedDocument(requestId, userId, buffer);

    return c.json({
      success: true,
      downloadUrl: result.downloadUrl,
    });
  } catch (error: any) {
    console.error('Finalize error:', error);
    return c.json({ error: error.message || 'Failed to finalize document' }, 500);
  }
});

// ===== DETECT FIELDS (Server-side text analysis) =====
// POST /esign/detect-fields
// Client sends extracted page text, server returns detected fields
esignRoutes.post('/detect-fields', async (c) => {
  try {
    const { pages } = await c.req.json<{
      pages: { pageNumber: number; text: string; width: number; height: number }[];
    }>();

    if (!pages || !Array.isArray(pages)) {
      return c.json({ error: 'Pages array is required' }, 400);
    }

    const fields = detectFieldsFromText(pages);

    return c.json({
      success: true,
      fieldCount: fields.length,
      fields,
    });
  } catch (error: any) {
    console.error('Detect fields error:', error);
    return c.json({ error: error.message || 'Failed to detect fields' }, 500);
  }
});

export { esignRoutes };
