import { db } from '../db';
import { auditLog } from '../db/schema';

interface AuditParams {
  documentId?: string;
  userId?: string;
  action: string;
  actorEmail?: string;
  ipAddress?: string;
  metadata?: Record<string, unknown>;
}

export async function logAudit(params: AuditParams): Promise<void> {
  try {
    await db.insert(auditLog).values({
      documentId: params.documentId || null,
      userId: params.userId || null,
      action: params.action,
      actorEmail: params.actorEmail || null,
      ipAddress: params.ipAddress || null,
      metadata: params.metadata || null,
    });
  } catch (error) {
    // Audit logging should never break the main flow
    console.error('Audit log failed:', error);
  }
}
