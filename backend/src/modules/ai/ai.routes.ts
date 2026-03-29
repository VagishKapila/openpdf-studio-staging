import { Hono } from 'hono';
import { requireAuth } from '../../shared/middleware/auth';
import { suggestFieldsForDocument, getOrgPatterns, learnFromDocument } from './pattern.service';
import { analyzeContractRisk } from './risk.service';
import { triageFeedback } from './feedback.service';

const ai = new Hono();
ai.use('/*', requireAuth);

// ── Suggest Fields for Document ──
ai.post('/suggest-fields', async (c) => {
  const body = await c.req.json();

  if (!body.orgId || !body.textContent) {
    return c.json({ error: 'orgId and textContent are required' }, 400);
  }

  try {
    const result = await suggestFieldsForDocument(body.orgId, body.textContent);
    return c.json({ data: result });
  } catch (err: any) {
    return c.json({ error: 'Failed to suggest fields' }, 500);
  }
});

// ── Learn from Document ──
ai.post('/learn', async (c) => {
  const body = await c.req.json();

  if (!body.orgId || !body.textContent || !body.name) {
    return c.json({ error: 'orgId, name, and textContent are required' }, 400);
  }

  try {
    const result = await learnFromDocument(body.orgId, body.name, body.textContent, body.fieldPositions || []);
    return c.json({ data: result });
  } catch (err: any) {
    return c.json({ error: 'Failed to learn from document' }, 500);
  }
});

// ── Get Org Patterns ──
ai.get('/patterns/:orgId', async (c) => {
  const orgId = c.req.param('orgId')!;
  try {
    const patterns = await getOrgPatterns(orgId);
    return c.json({ data: patterns });
  } catch (err: any) {
    return c.json({ error: 'Failed to fetch patterns' }, 500);
  }
});

// ── Analyze Contract Risk ──
ai.post('/risk-analysis', async (c) => {
  const body = await c.req.json();

  if (!body.textContent) {
    return c.json({ error: 'textContent is required' }, 400);
  }

  try {
    const result = analyzeContractRisk(body.textContent);
    return c.json({ data: result });
  } catch (err: any) {
    return c.json({ error: 'Failed to analyze risk' }, 500);
  }
});

// ── Triage Feedback ──
ai.post('/triage-feedback', async (c) => {
  const body = await c.req.json();

  if (!body.message) {
    return c.json({ error: 'message is required' }, 400);
  }

  try {
    const result = triageFeedback(body.message);
    return c.json({ data: result });
  } catch (err: any) {
    return c.json({ error: 'Failed to triage feedback' }, 500);
  }
});

// ── Get Risk Scans ──
ai.get('/risk-scans', async (c) => {
  try {
    const { db } = await import('../../shared/db');
    const { documents } = await import('../../shared/db/schema');
    const { desc, limit } = await import('drizzle-orm');

    // Fetch 10 most recent documents
    const recentDocs = await db
      .select()
      .from(documents)
      .orderBy(desc(documents.createdAt))
      .limit(10);

    // Analyze risk for each document
    const riskScans = recentDocs.map(doc => {
      const textContent = doc.metadata?.textContent || doc.fileName || '';
      const riskAnalysis = analyzeContractRisk(textContent);

      // Map risk levels: red -> danger, yellow -> warning, green -> safe
      const riskLevelMap: Record<string, 'danger' | 'warning' | 'safe'> = {
        'red': 'danger',
        'yellow': 'warning',
        'green': 'safe',
      };

      return {
        id: doc.id,
        documentId: doc.id,
        documentName: doc.originalFileName || doc.fileName,
        riskLevel: riskLevelMap[riskAnalysis.overallRisk] || 'warning',
        score: riskAnalysis.score / 10, // Normalize to 0-10 scale
        flagCount: riskAnalysis.flags.length,
        flags: riskAnalysis.flags.slice(0, 5), // Top 5 flags
        summary: riskAnalysis.summary,
        createdAt: doc.createdAt?.toISOString() || new Date().toISOString(),
      };
    });

    return c.json({ data: riskScans });
  } catch (err: any) {
    console.error('[ai:risk-scans] Error:', err);
    return c.json({ error: 'Failed to fetch risk scans' }, 500);
  }
});

// ── Get Feedback Stats ──
ai.get('/feedback-stats', async (c) => {
  try {
    const { db } = await import('../../shared/db');
    const { feedback } = await import('../../shared/db/schema');

    // Get all feedback
    const allFeedback = await db.select().from(feedback);

    // Count by category
    const byCategoryMap: Record<string, number> = {
      bug: 0,
      feature_request: 0,
      general: 0,
      security: 0,
    };

    const byPriorityMap: Record<string, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    for (const item of allFeedback) {
      byCategoryMap[item.category] = (byCategoryMap[item.category] || 0) + 1;
      byPriorityMap[item.priority] = (byPriorityMap[item.priority] || 0) + 1;
    }

    // Format response
    const byCategory = [
      { name: 'Bugs', value: byCategoryMap.bug, color: '#ef4444' },
      { name: 'Features', value: byCategoryMap.feature_request, color: '#f59e0b' },
      { name: 'Security', value: byCategoryMap.security, color: '#dc2626' },
      { name: 'General', value: byCategoryMap.general, color: '#3b82f6' },
    ];

    const byPriority = [
      { name: 'Critical', value: byPriorityMap.critical, color: '#dc2626' },
      { name: 'High', value: byPriorityMap.high, color: '#f97316' },
      { name: 'Medium', value: byPriorityMap.medium, color: '#eab308' },
      { name: 'Low', value: byPriorityMap.low, color: '#6b7280' },
    ];

    return c.json({
      data: {
        totalTriaged: allFeedback.length,
        byCategory,
        byPriority,
      },
    });
  } catch (err: any) {
    console.error('[ai:feedback-stats] Error:', err);
    return c.json({ error: 'Failed to fetch feedback stats' }, 500);
  }
});

export default ai;
