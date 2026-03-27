import { Hono } from 'hono';
import { requireAuth, getUser } from '../../shared/middleware/auth';
import {
  protectDocument,
  getDocumentProtection,
  getProtectionWithPasswords,
  getProtectedDownloadUrl,
  autoProtectAfterSigning,
  removeProtection,
  createPreset,
  updatePreset,
  listPresets,
  deletePreset,
  getDefaultPreset,
  type ProtectionOptions,
} from './protection.service';
import { getFromS3 } from '../../shared/utils/s3';
import { db } from '../../shared/db';
import { documents } from '../../shared/db/schema';
import { eq } from 'drizzle-orm';

const protectionRoutes = new Hono();

// ===== PROTECT A DOCUMENT (Standalone) =====
// POST /protection/protect
// Applies protection to any existing document
protectionRoutes.post('/protect', requireAuth, async (c) => {
  try {
    const user = getUser(c);
    const body = await c.req.json();

    const { documentId, options } = body as {
      documentId: string;
      options: ProtectionOptions;
    };

    if (!documentId) {
      return c.json({ error: 'documentId is required' }, 400);
    }

    // Verify user owns the document
    const [doc] = await db.select()
      .from(documents)
      .where(eq(documents.id, documentId));

    if (!doc) {
      return c.json({ error: 'Document not found' }, 404);
    }

    if (doc.userId !== user.id) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    // Get PDF from S3
    const pdfBuffer = await getFromS3(doc.s3Key);
    if (!pdfBuffer) {
      return c.json({ error: 'Failed to retrieve document from storage' }, 500);
    }

    // Apply protection
    const result = await protectDocument({
      documentId,
      userId: user.id,
      orgId: doc.orgId || undefined,
      pdfBuffer,
      options: options || {},
      autoProtected: false,
    });

    return c.json({
      success: true,
      protection: {
        id: result.protection.id,
        documentId: result.protection.documentId,
        protectionAppliedAt: result.protection.protectionAppliedAt,
        method: result.protection.protectionMethod,
        permissions: {
          printing: !result.protection.disablePrinting,
          copying: !result.protection.disableCopying,
          editing: !result.protection.disableEditing,
          annotations: !result.protection.disableAnnotations,
          formFilling: !result.protection.disableFormFilling,
          extraction: !result.protection.disableExtraction,
        },
        watermark: result.protection.watermarkEnabled,
      },
      passwords: {
        userPassword: result.passwords.userPassword || null,
        ownerPassword: result.passwords.ownerPassword,
      },
    });
  } catch (error) {
    console.error('[Protection] Error protecting document:', error);
    return c.json({ error: 'Failed to protect document' }, 500);
  }
});

// ===== PROTECT WITH UPLOAD (Standalone — upload PDF directly) =====
// POST /protection/protect-upload
// Upload a new PDF and apply protection in one step
protectionRoutes.post('/protect-upload', requireAuth, async (c) => {
  try {
    const user = getUser(c);
    const formData = await c.req.formData();

    const file = formData.get('file') as File;
    if (!file) {
      return c.json({ error: 'No file uploaded' }, 400);
    }

    const optionsStr = formData.get('options') as string;
    const options: ProtectionOptions = optionsStr ? JSON.parse(optionsStr) : {};

    const pdfBuffer = Buffer.from(await file.arrayBuffer());

    // Create a document record first
    const { uploadToS3, generateS3Key, getDownloadUrl } = await import('../../shared/utils/s3');
    const s3Key = generateS3Key(user.id, 'documents', file.name);
    await uploadToS3(s3Key, pdfBuffer, 'application/pdf');

    const [doc] = await db.insert(documents).values({
      userId: user.id,
      fileName: file.name,
      originalFileName: file.name,
      mimeType: 'application/pdf',
      fileSize: pdfBuffer.length,
      s3Key,
      status: 'completed',
    }).returning();

    // Apply protection
    const result = await protectDocument({
      documentId: doc.id,
      userId: user.id,
      pdfBuffer,
      options,
      autoProtected: false,
    });

    return c.json({
      success: true,
      document: {
        id: doc.id,
        fileName: doc.fileName,
      },
      protection: {
        id: result.protection.id,
        method: result.protection.protectionMethod,
      },
      passwords: {
        userPassword: result.passwords.userPassword || null,
        ownerPassword: result.passwords.ownerPassword,
      },
      downloadUrl: await getDownloadUrl(result.protection.protectedS3Key!),
    });
  } catch (error) {
    console.error('[Protection] Error protecting uploaded document:', error);
    return c.json({ error: 'Failed to protect document' }, 500);
  }
});

// ===== GET PROTECTION STATUS =====
// GET /protection/:documentId
protectionRoutes.get('/:documentId', requireAuth, async (c) => {
  try {
    const user = getUser(c);
    const documentId = c.req.param('documentId')!;

    const protection = await getDocumentProtection(documentId);

    if (!protection) {
      return c.json({ protected: false, protection: null });
    }

    // Don't reveal raw passwords in status check
    return c.json({
      protected: true,
      protection: {
        id: protection.id,
        documentId: protection.documentId,
        protectionAppliedAt: protection.protectionAppliedAt,
        method: protection.protectionMethod,
        autoProtected: protection.autoProtected,
        permissions: {
          printing: !protection.disablePrinting,
          copying: !protection.disableCopying,
          editing: !protection.disableEditing,
          annotations: !protection.disableAnnotations,
          formFilling: !protection.disableFormFilling,
          extraction: !protection.disableExtraction,
        },
        watermark: {
          enabled: protection.watermarkEnabled,
          text: protection.watermarkText,
        },
        hasUserPassword: !!protection.rawUserPassword,
        hasOwnerPassword: !!protection.rawOwnerPassword,
      },
    });
  } catch (error) {
    console.error('[Protection] Error getting protection status:', error);
    return c.json({ error: 'Failed to get protection status' }, 500);
  }
});

// ===== GET PASSWORDS (Owner Only) =====
// GET /protection/:protectionId/passwords
protectionRoutes.get('/:protectionId/passwords', requireAuth, async (c) => {
  try {
    const user = getUser(c);
    const protectionId = c.req.param('protectionId')!;

    const result = await getProtectionWithPasswords(protectionId, user.id);

    if (!result) {
      return c.json({ error: 'Protection not found or unauthorized' }, 404);
    }

    return c.json({
      passwords: {
        userPassword: result.userPassword || null,
        ownerPassword: result.ownerPassword,
      },
    });
  } catch (error) {
    console.error('[Protection] Error getting passwords:', error);
    return c.json({ error: 'Failed to retrieve passwords' }, 500);
  }
});

// ===== DOWNLOAD PROTECTED PDF =====
// GET /protection/:documentId/download
protectionRoutes.get('/:documentId/download', requireAuth, async (c) => {
  try {
    const user = getUser(c);
    const documentId = c.req.param('documentId')!;

    const downloadUrl = await getProtectedDownloadUrl(documentId, user.id);

    if (!downloadUrl) {
      return c.json({ error: 'No protected version available or unauthorized' }, 404);
    }

    return c.json({ downloadUrl });
  } catch (error) {
    console.error('[Protection] Error getting download URL:', error);
    return c.json({ error: 'Failed to get download URL' }, 500);
  }
});

// ===== REMOVE PROTECTION =====
// DELETE /protection/:protectionId
protectionRoutes.delete('/:protectionId', requireAuth, async (c) => {
  try {
    const user = getUser(c);
    const protectionId = c.req.param('protectionId')!;

    const success = await removeProtection(protectionId, user.id);

    if (!success) {
      return c.json({ error: 'Protection not found or unauthorized' }, 404);
    }

    return c.json({ success: true, message: 'Protection removed' });
  } catch (error) {
    console.error('[Protection] Error removing protection:', error);
    return c.json({ error: 'Failed to remove protection' }, 500);
  }
});

// ===== PRESET MANAGEMENT =====

// GET /protection/presets/list
protectionRoutes.get('/presets/list', requireAuth, async (c) => {
  try {
    const user = getUser(c);
    const orgId = c.req.query('orgId');

    const presets = await listPresets(user.id, orgId);
    return c.json({ presets });
  } catch (error) {
    console.error('[Protection] Error listing presets:', error);
    return c.json({ error: 'Failed to list presets' }, 500);
  }
});

// GET /protection/presets/default
protectionRoutes.get('/presets/default', requireAuth, async (c) => {
  try {
    const user = getUser(c);
    const orgId = c.req.query('orgId');

    const preset = await getDefaultPreset(user.id, orgId);
    return c.json({
      preset: preset || null,
      autoProtectEnabled: preset ? preset.autoProtectEnabled : true, // default ON
    });
  } catch (error) {
    console.error('[Protection] Error getting default preset:', error);
    return c.json({ error: 'Failed to get default preset' }, 500);
  }
});

// POST /protection/presets
protectionRoutes.post('/presets', requireAuth, async (c) => {
  try {
    const user = getUser(c);
    const body = await c.req.json();

    const preset = await createPreset({
      ...body,
      userId: user.id,
    });

    return c.json({ success: true, preset });
  } catch (error) {
    console.error('[Protection] Error creating preset:', error);
    return c.json({ error: 'Failed to create preset' }, 500);
  }
});

// PATCH /protection/presets/:presetId
protectionRoutes.patch('/presets/:presetId', requireAuth, async (c) => {
  try {
    const presetId = c.req.param('presetId')!;
    const body = await c.req.json();

    const updated = await updatePreset(presetId, body);

    if (!updated) {
      return c.json({ error: 'Preset not found' }, 404);
    }

    return c.json({ success: true, preset: updated });
  } catch (error) {
    console.error('[Protection] Error updating preset:', error);
    return c.json({ error: 'Failed to update preset' }, 500);
  }
});

// DELETE /protection/presets/:presetId
protectionRoutes.delete('/presets/:presetId', requireAuth, async (c) => {
  try {
    const presetId = c.req.param('presetId')!;

    await deletePreset(presetId);
    return c.json({ success: true, message: 'Preset deleted' });
  } catch (error) {
    console.error('[Protection] Error deleting preset:', error);
    return c.json({ error: 'Failed to delete preset' }, 500);
  }
});

// ===== AVAILABLE PROTECTION OPTIONS =====
// GET /protection/options
// Returns all available protection features (for UI rendering)
protectionRoutes.get('/options', async (c) => {
  return c.json({
    permissions: [
      { key: 'disablePrinting', label: 'Disable Printing', description: 'Prevents the document from being printed', default: true },
      { key: 'disableCopying', label: 'Disable Text Copying', description: 'Prevents copying text content from the document', default: true },
      { key: 'disableEditing', label: 'Disable Editing', description: 'Prevents any modifications to the document', default: true },
      { key: 'disableAnnotations', label: 'Disable Annotations', description: 'Prevents adding comments, highlights, or notes', default: true },
      { key: 'disableFormFilling', label: 'Disable Form Filling', description: 'Prevents filling in form fields after signing', default: true },
      { key: 'disableExtraction', label: 'Disable Content Extraction', description: 'Prevents extracting pages or content programmatically', default: true },
    ],
    encryptionMethods: [
      { key: 'aes-256', label: 'AES-256 (Recommended)', description: 'Strongest encryption, compatible with Acrobat 7+' },
      { key: 'aes-128', label: 'AES-128', description: 'Strong encryption, wider compatibility' },
      { key: 'rc4-128', label: 'RC4-128 (Legacy)', description: 'Older encryption, maximum compatibility with older readers' },
    ],
    watermark: {
      defaultOpacity: 0.15,
      defaultFontSize: 48,
      defaultColor: '#888888',
      defaultAngle: -45,
      maxTextLength: 500,
    },
    passwords: {
      userPasswordDescription: 'Required to OPEN the document. If not set, anyone can open it.',
      ownerPasswordDescription: 'Required to change permissions or remove protection. Auto-generated if not provided.',
      minLength: 6,
      maxLength: 128,
    },
  });
});

export { protectionRoutes };
