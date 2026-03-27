import { db } from '../../shared/db';
import { documentPatterns } from '../../shared/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import crypto from 'crypto';

// Generate a fingerprint from document text content
export function generateFingerprint(textContent: string): string {
  // Normalize: lowercase, remove extra whitespace, strip numbers/dates
  const normalized = textContent
    .toLowerCase()
    .replace(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/g, '[DATE]')
    .replace(/\$[\d,]+\.?\d*/g, '[AMOUNT]')
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]')
    .replace(/\s+/g, ' ')
    .trim();

  return crypto.createHash('sha256').update(normalized).digest('hex').substring(0, 32);
}

// Detect field positions based on keyword matching in text
export function detectFieldPositions(textContent: string): Array<{
  type: string;
  keyword: string;
  confidence: number;
}> {
  const fields: Array<{ type: string; keyword: string; confidence: number }> = [];

  const signaturePatterns = [
    { pattern: /signature[:\s]*_+|sign here|authorized signature/gi, type: 'signature', confidence: 0.9 },
    { pattern: /initial[s]?[:\s]*_+|initial here/gi, type: 'initials', confidence: 0.85 },
    { pattern: /date[:\s]*_+|dated this/gi, type: 'date', confidence: 0.8 },
    { pattern: /printed? name[:\s]*_+|full name/gi, type: 'name', confidence: 0.85 },
    { pattern: /title[:\s]*_+|position[:\s]*_+/gi, type: 'title', confidence: 0.7 },
    { pattern: /email[:\s]*_+/gi, type: 'email', confidence: 0.8 },
    { pattern: /address[:\s]*_+/gi, type: 'address', confidence: 0.7 },
    { pattern: /phone[:\s]*_+|telephone[:\s]*_+/gi, type: 'phone', confidence: 0.7 },
    { pattern: /witness[:\s]*_+/gi, type: 'witness_signature', confidence: 0.85 },
    { pattern: /notary[:\s]*_+/gi, type: 'notary_signature', confidence: 0.9 },
  ];

  for (const { pattern, type, confidence } of signaturePatterns) {
    const matches = textContent.match(pattern);
    if (matches) {
      for (const match of matches) {
        fields.push({ type, keyword: match.trim(), confidence });
      }
    }
  }

  return fields;
}

// Learn from a processed document — store or update pattern
export async function learnFromDocument(orgId: string, name: string, textContent: string, fieldPositions: unknown[]) {
  const fingerprint = generateFingerprint(textContent);

  try {
    // Check if pattern already exists
    const [existing] = await db
      .select()
      .from(documentPatterns)
      .where(and(
        eq(documentPatterns.orgId, orgId),
        eq(documentPatterns.fingerprint, fingerprint),
      ))
      .limit(1);

    if (existing) {
      // Update frequency and field positions
      await db
        .update(documentPatterns)
        .set({
          frequency: existing.frequency + 1,
          lastSeenAt: new Date(),
          fieldPositions: fieldPositions as any,
          confidence: Math.min(0.99, existing.confidence + 0.05), // increases with each occurrence
        })
        .where(eq(documentPatterns.id, existing.id));

      return { ...existing, frequency: existing.frequency + 1, isNew: false };
    } else {
      // Create new pattern
      const [pattern] = await db
        .insert(documentPatterns)
        .values({
          orgId,
          name,
          fingerprint,
          fieldPositions: fieldPositions as any,
          commonEdits: [],
          frequency: 1,
          confidence: 0.5,
        })
        .returning();

      return { ...pattern, isNew: true };
    }
  } catch (error) {
    console.error('[ai:pattern] Failed to learn from document:', error);
    return null;
  }
}

// Suggest fields for a new document based on fingerprint match
export async function suggestFieldsForDocument(orgId: string, textContent: string) {
  const fingerprint = generateFingerprint(textContent);

  try {
    // Exact fingerprint match
    const [exactMatch] = await db
      .select()
      .from(documentPatterns)
      .where(and(
        eq(documentPatterns.orgId, orgId),
        eq(documentPatterns.fingerprint, fingerprint),
      ))
      .limit(1);

    if (exactMatch && exactMatch.confidence >= 0.6) {
      return {
        matchType: 'exact' as const,
        pattern: exactMatch,
        suggestedFields: exactMatch.fieldPositions,
        confidence: exactMatch.confidence,
      };
    }

    // Fallback: keyword-based detection
    const detectedFields = detectFieldPositions(textContent);

    return {
      matchType: 'keyword' as const,
      pattern: null,
      suggestedFields: detectedFields,
      confidence: detectedFields.length > 0 ? 0.5 : 0,
    };
  } catch (error) {
    console.error('[ai:pattern] Failed to suggest fields:', error);
    return { matchType: 'none' as const, pattern: null, suggestedFields: [], confidence: 0 };
  }
}

// Get patterns for an org
export async function getOrgPatterns(orgId: string) {
  return db
    .select()
    .from(documentPatterns)
    .where(eq(documentPatterns.orgId, orgId))
    .orderBy(desc(documentPatterns.frequency))
    .limit(50);
}
