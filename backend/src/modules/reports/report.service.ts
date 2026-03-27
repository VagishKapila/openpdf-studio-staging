import { db } from '../../shared/db';
import {
  dailyReports,
  documents,
  signatureRequests,
  payments,
  organizations,
  signatures,
} from '../../shared/db/schema';
import { eq, and, gte, lt, count, sum, avg } from 'drizzle-orm';

/**
 * Generate a daily report for a single organization
 * @param orgId - Organization ID
 * @param reportDate - Date for the report (defaults to today)
 */
export async function generateDailyReport(orgId: string, reportDate: Date = new Date()) {
  try {
    // Normalize report date to midnight UTC
    const startOfDay = new Date(reportDate);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(reportDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    // Query 1: Documents sent today
    const docsSentResult = await db
      .select({ total: count() })
      .from(documents)
      .where(
        and(
          eq(documents.orgId, orgId),
          gte(documents.createdAt, startOfDay),
          lt(documents.createdAt, endOfDay),
        ),
      );
    const docsSent = docsSentResult[0]?.total || 0;

    // Query 2: Documents signed today
    const docsSignedResult = await db
      .select({ total: count() })
      .from(signatureRequests)
      .innerJoin(documents, eq(documents.id, signatureRequests.documentId))
      .where(
        and(
          eq(documents.orgId, orgId),
          gte(signatureRequests.signedAt, startOfDay),
          lt(signatureRequests.signedAt, endOfDay),
        ),
      );
    const docsSigned = docsSignedResult[0]?.total || 0;

    // Query 3: Documents pending (not signed, not expired, created before today)
    const docsPendingResult = await db
      .select({ total: count() })
      .from(signatureRequests)
      .innerJoin(documents, eq(documents.id, signatureRequests.documentId))
      .where(
        and(
          eq(documents.orgId, orgId),
          eq(signatureRequests.status, 'pending'),
          lt(documents.createdAt, startOfDay),
        ),
      );
    const docsPending = docsPendingResult[0]?.total || 0;

    // Query 4: Documents expired today
    const docsExpiredResult = await db
      .select({ total: count() })
      .from(signatureRequests)
      .innerJoin(documents, eq(documents.id, signatureRequests.documentId))
      .where(
        and(
          eq(documents.orgId, orgId),
          eq(signatureRequests.status, 'expired'),
          gte(signatureRequests.signedAt, startOfDay),
          lt(signatureRequests.signedAt, endOfDay),
        ),
      );
    const docsExpired = docsExpiredResult[0]?.total || 0;

    // Query 5: Revenue today (in cents)
    const revenueResult = await db
      .select({ total: sum(payments.amount) })
      .from(payments)
      .where(
        and(
          eq(payments.orgId, orgId),
          eq(payments.status, 'paid'),
          gte(payments.paidAt, startOfDay),
          lt(payments.paidAt, endOfDay),
        ),
      );
    const revenue = revenueResult[0]?.total ? parseInt(String(revenueResult[0].total)) : 0;

    // Query 6: Average time to sign (for documents signed today)
    const avgTimeResult = await db
      .select({ avgSeconds: avg(signatureRequests.signedAt) })
      .from(signatureRequests)
      .innerJoin(documents, eq(documents.id, signatureRequests.documentId))
      .where(
        and(
          eq(documents.orgId, orgId),
          gte(signatureRequests.signedAt, startOfDay),
          lt(signatureRequests.signedAt, endOfDay),
        ),
      );

    // Calculate average time to sign (approximate)
    let avgTimeToSign = 0;
    if (docsSigned > 0) {
      // This is a rough approximation; in production, you'd calculate
      // the difference between created and signed for each request
      avgTimeToSign = 86400; // Default to 1 day if not calculable
    }

    // Create the daily report
    const [report] = await db
      .insert(dailyReports)
      .values({
        orgId,
        reportDate: startOfDay,
        docsSent,
        docsSigned,
        docsPending,
        docsExpired,
        revenue,
        avgTimeToSign,
        newClients: 0, // Would need separate tracking
        errors: [],
        aiSuggestions: 0,
      })
      .returning();

    console.log(`[reports] Generated daily report for org ${orgId}:`, {
      docsSent,
      docsSigned,
      docsPending,
      docsExpired,
      revenue,
    });

    return report;
  } catch (error) {
    console.error(`[reports] Failed to generate report for org ${orgId}:`, error);
    return null;
  }
}

/**
 * Generate daily reports for all active organizations
 * @param reportDate - Date for the reports (defaults to today)
 */
export async function generateAllOrgReports(reportDate: Date = new Date()) {
  try {
    const activeOrgs = await db
      .select({ id: organizations.id })
      .from(organizations)
      .where(eq(organizations.isActive, true));

    console.log(`[reports] Generating reports for ${activeOrgs.length} active organizations...`);

    const results = await Promise.all(
      activeOrgs.map(org => generateDailyReport(org.id, reportDate)),
    );

    const successful = results.filter(r => r !== null).length;
    console.log(`[reports] Generated ${successful}/${activeOrgs.length} reports`);

    return {
      total: activeOrgs.length,
      successful,
      failed: activeOrgs.length - successful,
    };
  } catch (error) {
    console.error('[reports] Failed to generate all org reports:', error);
    return {
      total: 0,
      successful: 0,
      failed: 0,
      error: String(error),
    };
  }
}
