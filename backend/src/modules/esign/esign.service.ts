import { db } from '../../shared/db';
import { documents, signatureRequests, signatureFields, signatures, auditLog } from '../../shared/db/schema';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { uploadToS3, getFromS3, getDownloadUrl, generateS3Key } from '../../shared/utils/s3';
import crypto from 'crypto';
import { autoProtectAfterSigning } from '../protection/protection.service';

// ===== TYPES =====
export interface DetectedField {
  fieldType: 'signature' | 'initials' | 'date' | 'name' | 'text';
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  aiDetected: boolean;
}

export interface PrepareDocumentInput {
  userId: string;
  file: {
    buffer: Buffer;
    fileName: string;
    mimeType: string;
    size: number;
  };
}

export interface SignFieldInput {
  fieldId: string;
  signatureDataUrl?: string;  // base64 for signature/initials
  textValue?: string;         // for name/date/text fields
  signatureType?: 'draw' | 'type' | 'upload';
}

export interface SignDocumentInput {
  requestId: string;
  signerEmail: string;
  signerName: string;
  fields: SignFieldInput[];
  ipAddress: string;
  userAgent: string;
}

// ===== FIELD DETECTION (Heuristic-Based) =====
// This analyzes common patterns in document text to detect where fields should go.
// In a real production system, this would use AI/ML for better detection.

const SIGNATURE_KEYWORDS = [
  'signature', 'sign here', 'signed', 'authorized signature',
  'client signature', 'your signature', 'applicant signature',
  'tenant signature', 'buyer signature', 'seller signature',
  'employee signature', 'employer signature', 'witness signature',
  'party signature', 'signer', 'autograph',
];

const INITIALS_KEYWORDS = [
  'initials', 'initial here', 'init', 'your initials',
];

const DATE_KEYWORDS = [
  'date:', 'date signed', 'dated', 'signing date',
  'effective date', 'execution date', 'as of',
  '__/__/____', 'mm/dd/yyyy', 'dd/mm/yyyy',
];

const NAME_KEYWORDS = [
  'print name', 'printed name', 'full name', 'name:',
  'signer name', 'your name', 'type name',
  'legal name', 'first name', 'last name',
];

/**
 * Detect signature-related fields in document text.
 * Returns standardized field positions based on keyword matching.
 * Page dimensions assumed as standard US Letter (612 x 792 points).
 */
export function detectFieldsFromText(
  pages: { pageNumber: number; text: string; width: number; height: number }[]
): DetectedField[] {
  const fields: DetectedField[] = [];

  for (const page of pages) {
    const lines = page.text.split('\n');
    const pageHeight = page.height || 792;
    const pageWidth = page.width || 612;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase().trim();
      if (!line) continue;

      const yPosition = (i / Math.max(lines.length, 1)) * pageHeight;

      // Check for signature fields
      for (const keyword of SIGNATURE_KEYWORDS) {
        if (line.includes(keyword)) {
          fields.push({
            fieldType: 'signature',
            pageNumber: page.pageNumber,
            x: pageWidth * 0.1,
            y: yPosition + 15,
            width: 200,
            height: 50,
            label: `Signature (${keyword})`,
            aiDetected: true,
          });

          // Also look for an adjacent date field
          if (!line.includes('date')) {
            // Add a date field next to the signature
            fields.push({
              fieldType: 'date',
              pageNumber: page.pageNumber,
              x: pageWidth * 0.65,
              y: yPosition + 15,
              width: 120,
              height: 25,
              label: 'Date',
              aiDetected: true,
            });
          }
          break;
        }
      }

      // Check for initials fields
      for (const keyword of INITIALS_KEYWORDS) {
        if (line.includes(keyword)) {
          fields.push({
            fieldType: 'initials',
            pageNumber: page.pageNumber,
            x: pageWidth * 0.1,
            y: yPosition + 10,
            width: 80,
            height: 40,
            label: `Initials (${keyword})`,
            aiDetected: true,
          });
          break;
        }
      }

      // Check for date fields
      for (const keyword of DATE_KEYWORDS) {
        if (line.includes(keyword)) {
          const alreadyHasDate = fields.some(
            f => f.fieldType === 'date' && f.pageNumber === page.pageNumber &&
                 Math.abs(f.y - (yPosition + 10)) < 30
          );
          if (!alreadyHasDate) {
            fields.push({
              fieldType: 'date',
              pageNumber: page.pageNumber,
              x: pageWidth * 0.3,
              y: yPosition + 10,
              width: 120,
              height: 25,
              label: `Date (${keyword})`,
              aiDetected: true,
            });
          }
          break;
        }
      }

      // Check for name fields
      for (const keyword of NAME_KEYWORDS) {
        if (line.includes(keyword)) {
          fields.push({
            fieldType: 'name',
            pageNumber: page.pageNumber,
            x: pageWidth * 0.1,
            y: yPosition + 10,
            width: 200,
            height: 25,
            label: `Name (${keyword})`,
            aiDetected: true,
          });
          break;
        }
      }
    }
  }

  return fields;
}

// ===== PREPARE DOCUMENT FOR SIGNING =====
export async function prepareDocument(input: PrepareDocumentInput) {
  const { userId, file } = input;

  // 1. Upload original to S3
  const s3Key = generateS3Key(userId, 'documents', file.fileName);
  await uploadToS3(s3Key, file.buffer, file.mimeType);

  // 2. Create document record
  const [doc] = await db.insert(documents).values({
    userId,
    fileName: file.fileName,
    originalFileName: file.fileName,
    mimeType: file.mimeType,
    fileSize: file.size,
    s3Key,
    status: 'draft',
  }).returning();

  // 3. Create signature request
  const accessToken = crypto.randomBytes(32).toString('hex');
  const [request] = await db.insert(signatureRequests).values({
    documentId: doc.id,
    senderId: userId,
    recipientEmail: '', // self-signing for now
    recipientName: '',
    status: 'pending',
    accessToken,
  }).returning();

  // 4. Log audit
  await db.insert(auditLog).values({
    documentId: doc.id,
    userId,
    action: 'document.created',
    metadata: { fileName: file.fileName, fileSize: file.size },
  });

  return {
    document: doc,
    request,
    downloadUrl: await getDownloadUrl(s3Key),
  };
}

// ===== SAVE DETECTED FIELDS =====
export async function saveDetectedFields(requestId: string, detectedFields: DetectedField[]) {
  if (detectedFields.length === 0) return [];

  const fieldRecords = detectedFields.map(f => ({
    requestId,
    fieldType: f.fieldType,
    pageNumber: f.pageNumber,
    x: f.x,
    y: f.y,
    width: f.width,
    height: f.height,
    label: f.label,
    aiDetected: f.aiDetected,
    required: true,
  }));

  const inserted = await db.insert(signatureFields).values(fieldRecords).returning();
  return inserted;
}

// ===== GET SIGNATURE REQUEST WITH FIELDS =====
export async function getSignatureRequest(requestId: string) {
  const [request] = await db.select()
    .from(signatureRequests)
    .where(eq(signatureRequests.id, requestId));

  if (!request) return null;

  const fields = await db.select()
    .from(signatureFields)
    .where(eq(signatureFields.requestId, requestId));

  const [doc] = await db.select()
    .from(documents)
    .where(eq(documents.id, request.documentId));

  const downloadUrl = doc ? await getDownloadUrl(doc.s3Key) : null;

  return { request, fields, document: doc, downloadUrl };
}

// ===== SIGN DOCUMENT (Save Signatures) =====
export async function signDocument(input: SignDocumentInput) {
  const { requestId, signerEmail, signerName, fields, ipAddress, userAgent } = input;

  // 1. Save each signature/field value
  for (const field of fields) {
    await db.insert(signatures).values({
      fieldId: field.fieldId,
      signerEmail,
      signerName,
      signatureDataUrl: field.signatureDataUrl || null,
      signatureType: field.signatureType || null,
      ipAddress,
      userAgent,
    });
  }

  // 2. Update request status
  await db.update(signatureRequests)
    .set({ status: 'signed', signedAt: new Date() })
    .where(eq(signatureRequests.id, requestId));

  // 3. Get the document to update its status
  const [request] = await db.select()
    .from(signatureRequests)
    .where(eq(signatureRequests.id, requestId));

  if (request) {
    await db.update(documents)
      .set({ status: 'signed', updatedAt: new Date() })
      .where(eq(documents.id, request.documentId));

    // 4. Audit log
    await db.insert(auditLog).values({
      documentId: request.documentId,
      userId: request.senderId,
      action: 'signature.signed',
      actorEmail: signerEmail,
      ipAddress,
      metadata: { signerName, fieldCount: fields.length },
    });
  }

  return { success: true, requestId };
}

// ===== SAVE SIGNED (FLATTENED) PDF =====
export async function saveSignedDocument(
  requestId: string,
  userId: string,
  pdfBuffer: Buffer
) {
  const [request] = await db.select()
    .from(signatureRequests)
    .where(eq(signatureRequests.id, requestId));

  if (!request) throw new Error('Request not found');

  // Upload signed PDF to S3
  const signedKey = generateS3Key(userId, 'signed', 'signed-document.pdf');
  await uploadToS3(signedKey, pdfBuffer, 'application/pdf');

  // Update request with signed document key
  await db.update(signatureRequests)
    .set({ signedDocumentS3Key: signedKey })
    .where(eq(signatureRequests.id, requestId));

  // Update document status
  await db.update(documents)
    .set({ status: 'signed', updatedAt: new Date() })
    .where(eq(documents.id, request.documentId));

  // Auto-protect the signed document (if enabled)
  let protectionResult = null;
  try {
    const autoProtect = await autoProtectAfterSigning(
      request.documentId,
      userId,
      pdfBuffer,
      undefined, // orgId — will be fetched from document if needed
    );

    if (autoProtect.protected) {
      protectionResult = {
        protectionId: autoProtect.protection?.id,
        ownerPassword: autoProtect.passwords?.ownerPassword,
        userPassword: autoProtect.passwords?.userPassword,
        protectedDownloadUrl: autoProtect.protection?.protectedS3Key
          ? await getDownloadUrl(autoProtect.protection.protectedS3Key)
          : null,
      };
      console.log(`[Esign] Auto-protection applied to document ${request.documentId}`);
    }
  } catch (error) {
    // Auto-protection is non-blocking — signing succeeds even if protection fails
    console.error(`[Esign] Auto-protection failed for document ${request.documentId}:`, error);
  }

  return {
    signedKey,
    downloadUrl: await getDownloadUrl(signedKey),
    protection: protectionResult,
  };
}
