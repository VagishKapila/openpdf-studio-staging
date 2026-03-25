import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { v4 as uuidv4 } from 'uuid';
import { eq } from 'drizzle-orm';
import { db } from '../../shared/db';
import { documents } from '../../shared/db/schema';
import { uploadToS3, generateS3Key, getDownloadUrl } from '../../shared/utils/s3';
import { logAudit } from '../../shared/utils/audit';

const execAsync = promisify(exec);

// Supported input formats
const SUPPORTED_FORMATS: Record<string, string> = {
  // Office documents
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'application/vnd.ms-powerpoint': 'ppt',
  // Text
  'text/plain': 'txt',
  'text/html': 'html',
  'text/markdown': 'md',
  'application/rtf': 'rtf',
  // Images
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'image/bmp': 'bmp',
  'image/tiff': 'tiff',
  'image/webp': 'webp',
  // PDF passthrough
  'application/pdf': 'pdf',
};

const EXTENSION_TO_MIME: Record<string, string> = {
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  doc: 'application/msword',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  xls: 'application/vnd.ms-excel',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ppt: 'application/vnd.ms-powerpoint',
  txt: 'text/plain',
  html: 'text/html',
  md: 'text/markdown',
  rtf: 'application/rtf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  bmp: 'image/bmp',
  tiff: 'image/tiff',
  webp: 'image/webp',
  pdf: 'application/pdf',
};

export function isSupportedFormat(mimeType: string): boolean {
  return mimeType in SUPPORTED_FORMATS;
}

export function getMimeFromExtension(ext: string): string {
  return EXTENSION_TO_MIME[ext.toLowerCase()] || 'application/octet-stream';
}

interface ConvertResult {
  documentId: string;
  pdfS3Key: string;
  downloadUrl: string;
  pageCount: number;
  originalFormat: string;
}

// Convert any supported file to PDF
export async function convertToPdf(
  fileBuffer: Buffer,
  originalFileName: string,
  mimeType: string,
  userId: string,
  ip?: string,
): Promise<ConvertResult> {
  const ext = originalFileName.split('.').pop()?.toLowerCase() || '';

  // Validate format
  if (!mimeType) {
    mimeType = getMimeFromExtension(ext);
  }

  // Create temp directory for this conversion
  const tmpDir = path.join(os.tmpdir(), `dpstudio-convert-${uuidv4()}`);
  await fs.mkdir(tmpDir, { recursive: true });

  try {
    const inputPath = path.join(tmpDir, `input.${ext}`);
    await fs.writeFile(inputPath, fileBuffer);

    let pdfBuffer: Buffer;
    let pageCount = 1;

    if (mimeType === 'application/pdf') {
      // Already a PDF — pass through
      pdfBuffer = fileBuffer;
    } else if (mimeType.startsWith('image/')) {
      // Convert image to PDF using ImageMagick or a simple canvas approach
      pdfBuffer = await convertImageToPdf(inputPath, tmpDir);
    } else {
      // Office documents — use LibreOffice headless
      pdfBuffer = await convertWithLibreOffice(inputPath, tmpDir);
    }

    // Upload original file to S3
    const originalS3Key = generateS3Key(userId, 'originals', originalFileName);
    await uploadToS3(originalS3Key, fileBuffer, mimeType);

    // Upload converted PDF to S3
    const pdfFileName = originalFileName.replace(/\.[^.]+$/, '.pdf');
    const pdfS3Key = generateS3Key(userId, 'documents', pdfFileName);
    await uploadToS3(pdfS3Key, pdfBuffer, 'application/pdf');

    // Create document record
    const [doc] = await db.insert(documents).values({
      userId,
      fileName: pdfFileName,
      originalFileName,
      mimeType: 'application/pdf',
      fileSize: pdfBuffer.length,
      s3Key: pdfS3Key,
      s3KeyOriginal: originalS3Key,
      status: 'draft',
      pageCount,
    }).returning();

    const downloadUrl = await getDownloadUrl(pdfS3Key);

    await logAudit({
      documentId: doc.id,
      userId,
      action: 'document.converted',
      ipAddress: ip,
      metadata: { originalFormat: ext, originalSize: fileBuffer.length, pdfSize: pdfBuffer.length },
    });

    return {
      documentId: doc.id,
      pdfS3Key,
      downloadUrl,
      pageCount,
      originalFormat: ext,
    };
  } finally {
    // Clean up temp files
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}

// Convert office documents using LibreOffice
async function convertWithLibreOffice(inputPath: string, tmpDir: string): Promise<Buffer> {
  try {
    await execAsync(
      `libreoffice --headless --convert-to pdf --outdir "${tmpDir}" "${inputPath}"`,
      { timeout: 60000 } // 60 second timeout
    );

    // Find the output PDF
    const files = await fs.readdir(tmpDir);
    const pdfFile = files.find(f => f.endsWith('.pdf'));

    if (!pdfFile) {
      throw new Error('LibreOffice conversion produced no output');
    }

    return await fs.readFile(path.join(tmpDir, pdfFile));
  } catch (error: any) {
    if (error.killed) {
      throw new Error('Conversion timed out — file may be too large or complex');
    }
    throw new Error(`Conversion failed: ${error.message}`);
  }
}

// Convert image to PDF (simple approach using a PDF wrapper)
async function convertImageToPdf(inputPath: string, tmpDir: string): Promise<Buffer> {
  // Use LibreOffice for image conversion too — it handles it well
  try {
    await execAsync(
      `libreoffice --headless --convert-to pdf --outdir "${tmpDir}" "${inputPath}"`,
      { timeout: 30000 }
    );

    const files = await fs.readdir(tmpDir);
    const pdfFile = files.find(f => f.endsWith('.pdf'));

    if (!pdfFile) {
      throw new Error('Image to PDF conversion produced no output');
    }

    return await fs.readFile(path.join(tmpDir, pdfFile));
  } catch (error: any) {
    throw new Error(`Image conversion failed: ${error.message}`);
  }
}

// Get document by ID
export async function getDocument(documentId: string, userId: string) {
  const [doc] = await db.select().from(documents)
    .where(eq(documents.id, documentId))
    .limit(1);

  if (!doc || doc.userId !== userId) {
    throw new Error('Document not found');
  }

  const downloadUrl = await getDownloadUrl(doc.s3Key);
  return { ...doc, downloadUrl };
}

// List user's documents
export async function listDocuments(userId: string, limit = 50, offset = 0) {
  const docs = await db.select().from(documents)
    .where(eq(documents.userId, userId))
    .orderBy(documents.createdAt)
    .limit(limit)
    .offset(offset);

  return docs;
}
