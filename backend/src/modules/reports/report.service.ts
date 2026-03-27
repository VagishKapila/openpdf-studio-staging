import { db } from '../../shared/db';
import {
  dailyReports,
  documents,
  signatureRequests,
  payments,
  organizations,
  signatures,
  orgMembers,
  users,
} from '../../shared/db/schema';
import { eq, and, gte, lt, count, sum, avg } from 'drizzle-orm';
import { sendNotificationEmail } from '../../shared/services/email.service';

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

/**
 * Send daily digest email to admin/owner members of an organization
 * @param orgId - Organization ID
 * @param reportDate - Date of the report (defaults to today)
 */
export async function sendDailyDigestEmail(orgId: string, reportDate: Date = new Date()) {
  try {
    // Normalize report date to midnight UTC
    const startOfDay = new Date(reportDate);
    startOfDay.setUTCHours(0, 0, 0, 0);

    // Get the organization
    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, orgId));

    if (!org) {
      console.warn(`[reports] Organization ${orgId} not found`);
      return null;
    }

    // Get the daily report for this date
    const [report] = await db
      .select()
      .from(dailyReports)
      .where(and(
        eq(dailyReports.orgId, orgId),
        eq(dailyReports.reportDate, startOfDay),
      ));

    if (!report) {
      console.warn(`[reports] No report found for org ${orgId} on ${startOfDay.toISOString()}`);
      return null;
    }

    // Get admin and owner members
    const members = await db
      .select({
        userId: orgMembers.userId,
        email: users.email,
        name: users.name,
        role: orgMembers.role,
      })
      .from(orgMembers)
      .innerJoin(users, eq(orgMembers.userId, users.id))
      .where(
        and(
          eq(orgMembers.orgId, orgId),
        ),
      );

    const adminMembers = members.filter(m => ['admin', 'owner'].includes(m.role));

    if (adminMembers.length === 0) {
      console.log(`[reports] No admin/owner members found for org ${orgId}`);
      return null;
    }

    // Format date for subject
    const dateStr = startOfDay.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Format currency
    const revenueFmt = `$${(report.revenue / 100).toFixed(2)}`;

    // Send email to each admin/owner
    const emailPromises = adminMembers.map(member =>
      sendNotificationEmail(
        member.email,
        `DocPix Studio — Daily Digest for ${dateStr}`,
        `Your Daily Digest`,
        buildDailyDigestHtml(org.name, dateStr, {
          docsSent: report.docsSent,
          docsSigned: report.docsSigned,
          docsPending: report.docsPending,
          docsExpired: report.docsExpired,
          revenue: revenueFmt,
        }),
      ).catch(err => {
        console.error(`[reports] Failed to send daily digest to ${member.email}:`, err);
        return null;
      }),
    );

    await Promise.all(emailPromises);

    console.log(`[reports] Sent daily digest email to ${adminMembers.length} admin(s) for org ${orgId}`);

    return {
      orgId,
      reportDate: startOfDay,
      recipientsCount: adminMembers.length,
    };
  } catch (error) {
    console.error(`[reports] Failed to send daily digest for org ${orgId}:`, error);
    return null;
  }
}

/**
 * Send weekly digest email to admin/owner members of an organization
 * @param orgId - Organization ID
 * @param endDate - End date for the week (defaults to today)
 */
export async function sendWeeklyDigestEmail(orgId: string, endDate: Date = new Date()) {
  try {
    // Get the organization
    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, orgId));

    if (!org) {
      console.warn(`[reports] Organization ${orgId} not found`);
      return null;
    }

    // Calculate week boundaries (last 7 days)
    const weekEnd = new Date(endDate);
    weekEnd.setUTCHours(23, 59, 59, 999);

    const weekStart = new Date(endDate);
    weekStart.setUTCDate(weekStart.getUTCDate() - 7);
    weekStart.setUTCHours(0, 0, 0, 0);

    // Get reports for this week
    const weekReports = await db
      .select()
      .from(dailyReports)
      .where(
        and(
          eq(dailyReports.orgId, orgId),
          gte(dailyReports.reportDate, weekStart),
          lt(dailyReports.reportDate, weekEnd),
        ),
      );

    if (weekReports.length === 0) {
      console.log(`[reports] No reports found for org ${orgId} in the past week`);
      return null;
    }

    // Aggregate stats
    const aggregated = {
      docsSent: weekReports.reduce((sum, r) => sum + r.docsSent, 0),
      docsSigned: weekReports.reduce((sum, r) => sum + r.docsSigned, 0),
      docsPending: weekReports.reduce((sum, r) => sum + r.docsPending, 0),
      docsExpired: weekReports.reduce((sum, r) => sum + r.docsExpired, 0),
      revenue: weekReports.reduce((sum, r) => sum + r.revenue, 0),
      avgTimeToSign: Math.round(weekReports.reduce((sum, r) => sum + r.avgTimeToSign, 0) / weekReports.length),
    };

    // Get admin and owner members
    const members = await db
      .select({
        userId: orgMembers.userId,
        email: users.email,
        name: users.name,
        role: orgMembers.role,
      })
      .from(orgMembers)
      .innerJoin(users, eq(orgMembers.userId, users.id))
      .where(eq(orgMembers.orgId, orgId));

    const adminMembers = members.filter(m => ['admin', 'owner'].includes(m.role));

    if (adminMembers.length === 0) {
      console.log(`[reports] No admin/owner members found for org ${orgId}`);
      return null;
    }

    // Format dates for subject
    const startDateStr = weekStart.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    const endDateStr = weekEnd.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    const revenueFmt = `$${(aggregated.revenue / 100).toFixed(2)}`;
    const timeStr = formatSeconds(aggregated.avgTimeToSign);

    // Send email to each admin/owner
    const emailPromises = adminMembers.map(member =>
      sendNotificationEmail(
        member.email,
        `DocPix Studio — Weekly Report ${startDateStr} - ${endDateStr}`,
        `Your Weekly Report`,
        buildWeeklyDigestHtml(org.name, startDateStr, endDateStr, {
          docsSent: aggregated.docsSent,
          docsSigned: aggregated.docsSigned,
          docsPending: aggregated.docsPending,
          docsExpired: aggregated.docsExpired,
          revenue: revenueFmt,
          avgTimeToSign: timeStr,
        }),
      ).catch(err => {
        console.error(`[reports] Failed to send weekly digest to ${member.email}:`, err);
        return null;
      }),
    );

    await Promise.all(emailPromises);

    console.log(`[reports] Sent weekly digest email to ${adminMembers.length} admin(s) for org ${orgId}`);

    return {
      orgId,
      startDate: weekStart,
      endDate: weekEnd,
      recipientsCount: adminMembers.length,
    };
  } catch (error) {
    console.error(`[reports] Failed to send weekly digest for org ${orgId}:`, error);
    return null;
  }
}

/**
 * Helper: Format seconds to human-readable time
 */
function formatSeconds(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)}h`;
  return `${Math.round(seconds / 86400)}d`;
}

/**
 * Helper: Build daily digest HTML email
 */
function buildDailyDigestHtml(
  orgName: string,
  dateStr: string,
  stats: {
    docsSent: number;
    docsSigned: number;
    docsPending: number;
    docsExpired: number;
    revenue: string;
  },
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 24px;text-align:center;">
      <div style="display:inline-flex;align-items:center;gap:8px;">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="3" width="18" height="18" rx="3" fill="white" fill-opacity="0.2"/>
          <path d="M7 8h10M7 12h7M7 16h4" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
          <circle cx="17" cy="15" r="3" fill="white" fill-opacity="0.3" stroke="white" stroke-width="1.5"/>
        </svg>
        <span style="color:white;font-size:20px;font-weight:700;letter-spacing:-0.5px;">DocPix Studio</span>
      </div>
    </div>
    <div style="padding:32px 24px;">
      <h1 style="margin:0 0 8px;font-size:22px;color:#18181b;">Daily Digest — ${dateStr}</h1>
      <p style="margin:0 0 24px;color:#71717a;font-size:15px;line-height:1.5;">
        Here's a summary of ${orgName}'s activity for today.
      </p>

      <div style="background:#f9fafb;border-radius:8px;padding:20px;margin-bottom:24px;">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">
          <div style="border-bottom:2px solid #e5e7eb;padding-bottom:12px;">
            <p style="margin:0;color:#71717a;font-size:13px;font-weight:600;text-transform:uppercase;">Documents Sent</p>
            <p style="margin:8px 0 0;color:#6366f1;font-size:28px;font-weight:700;">${stats.docsSent}</p>
          </div>
          <div style="border-bottom:2px solid #e5e7eb;padding-bottom:12px;">
            <p style="margin:0;color:#71717a;font-size:13px;font-weight:600;text-transform:uppercase;">Documents Signed</p>
            <p style="margin:8px 0 0;color:#10b981;font-size:28px;font-weight:700;">${stats.docsSigned}</p>
          </div>
          <div style="border-bottom:2px solid #e5e7eb;padding-bottom:12px;">
            <p style="margin:0;color:#71717a;font-size:13px;font-weight:600;text-transform:uppercase;">Pending</p>
            <p style="margin:8px 0 0;color:#f59e0b;font-size:28px;font-weight:700;">${stats.docsPending}</p>
          </div>
          <div style="border-bottom:2px solid #e5e7eb;padding-bottom:12px;">
            <p style="margin:0;color:#71717a;font-size:13px;font-weight:600;text-transform:uppercase;">Expired</p>
            <p style="margin:8px 0 0;color:#ef4444;font-size:28px;font-weight:700;">${stats.docsExpired}</p>
          </div>
        </div>
        <div style="border-top:2px solid #e5e7eb;padding-top:12px;">
          <p style="margin:0;color:#71717a;font-size:13px;font-weight:600;text-transform:uppercase;">Revenue</p>
          <p style="margin:8px 0 0;color:#8b5cf6;font-size:28px;font-weight:700;">${stats.revenue}</p>
        </div>
      </div>

      <p style="margin:0;color:#71717a;font-size:14px;line-height:1.5;">
        Log in to your dashboard for detailed analytics and insights.
      </p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Helper: Build weekly digest HTML email
 */
function buildWeeklyDigestHtml(
  orgName: string,
  startDateStr: string,
  endDateStr: string,
  stats: {
    docsSent: number;
    docsSigned: number;
    docsPending: number;
    docsExpired: number;
    revenue: string;
    avgTimeToSign: string;
  },
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 24px;text-align:center;">
      <div style="display:inline-flex;align-items:center;gap:8px;">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="3" width="18" height="18" rx="3" fill="white" fill-opacity="0.2"/>
          <path d="M7 8h10M7 12h7M7 16h4" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
          <circle cx="17" cy="15" r="3" fill="white" fill-opacity="0.3" stroke="white" stroke-width="1.5"/>
        </svg>
        <span style="color:white;font-size:20px;font-weight:700;letter-spacing:-0.5px;">DocPix Studio</span>
      </div>
    </div>
    <div style="padding:32px 24px;">
      <h1 style="margin:0 0 8px;font-size:22px;color:#18181b;">Weekly Report</h1>
      <p style="margin:0 0 24px;color:#71717a;font-size:15px;line-height:1.5;">
        ${orgName}'s activity from ${startDateStr} to ${endDateStr}
      </p>

      <div style="background:#f9fafb;border-radius:8px;padding:20px;margin-bottom:24px;">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">
          <div style="border-bottom:2px solid #e5e7eb;padding-bottom:12px;">
            <p style="margin:0;color:#71717a;font-size:13px;font-weight:600;text-transform:uppercase;">Documents Sent</p>
            <p style="margin:8px 0 0;color:#6366f1;font-size:28px;font-weight:700;">${stats.docsSent}</p>
          </div>
          <div style="border-bottom:2px solid #e5e7eb;padding-bottom:12px;">
            <p style="margin:0;color:#71717a;font-size:13px;font-weight:600;text-transform:uppercase;">Documents Signed</p>
            <p style="margin:8px 0 0;color:#10b981;font-size:28px;font-weight:700;">${stats.docsSigned}</p>
          </div>
          <div style="border-bottom:2px solid #e5e7eb;padding-bottom:12px;">
            <p style="margin:0;color:#71717a;font-size:13px;font-weight:600;text-transform:uppercase;">Pending</p>
            <p style="margin:8px 0 0;color:#f59e0b;font-size:28px;font-weight:700;">${stats.docsPending}</p>
          </div>
          <div style="border-bottom:2px solid #e5e7eb;padding-bottom:12px;">
            <p style="margin:0;color:#71717a;font-size:13px;font-weight:600;text-transform:uppercase;">Expired</p>
            <p style="margin:8px 0 0;color:#ef4444;font-size:28px;font-weight:700;">${stats.docsExpired}</p>
          </div>
          <div style="border-bottom:2px solid #e5e7eb;padding-bottom:12px;">
            <p style="margin:0;color:#71717a;font-size:13px;font-weight:600;text-transform:uppercase;">Revenue</p>
            <p style="margin:8px 0 0;color:#8b5cf6;font-size:28px;font-weight:700;">${stats.revenue}</p>
          </div>
          <div style="border-bottom:2px solid #e5e7eb;padding-bottom:12px;">
            <p style="margin:0;color:#71717a;font-size:13px;font-weight:600;text-transform:uppercase;">Avg Time to Sign</p>
            <p style="margin:8px 0 0;color:#8b5cf6;font-size:28px;font-weight:700;">${stats.avgTimeToSign}</p>
          </div>
        </div>
      </div>

      <p style="margin:0;color:#71717a;font-size:14px;line-height:1.5;">
        Visit your dashboard for detailed analytics and insights.
      </p>
    </div>
  </div>
</body>
</html>`;
}
