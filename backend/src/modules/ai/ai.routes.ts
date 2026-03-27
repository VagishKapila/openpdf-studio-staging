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

export default ai;
