import { db } from '../../shared/db';
import { feedback } from '../../shared/db/schema';
import { eq } from 'drizzle-orm';

export interface TriageResult {
  category: 'bug' | 'feature_request' | 'general' | 'security';
  priority: 'critical' | 'high' | 'medium' | 'low';
  aiSummary: string;
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  bug: ['bug', 'error', 'crash', 'broken', 'not working', 'fails', 'issue', 'problem', 'wrong', 'fix', 'glitch', '500', '404', 'exception', 'undefined'],
  feature_request: ['feature', 'would be nice', 'please add', 'suggestion', 'request', 'wish', 'could you', 'want', 'need', 'missing', 'improve', 'enhancement'],
  security: ['security', 'vulnerability', 'hack', 'breach', 'password', 'leak', 'exposed', 'unsafe', 'injection', 'xss', 'csrf', 'unauthorized', 'permission'],
  general: ['question', 'how to', 'help', 'confused', 'understand', 'pricing', 'account', 'support'],
};

const PRIORITY_KEYWORDS: Record<string, string[]> = {
  critical: ['urgent', 'critical', 'emergency', 'asap', 'immediately', 'down', 'outage', 'production', 'data loss', 'security breach', 'cannot access', 'blocked'],
  high: ['important', 'serious', 'major', 'significant', 'affecting many', 'high priority', 'business impact', 'deadline'],
  low: ['minor', 'small', 'cosmetic', 'nice to have', 'when you get a chance', 'low priority', 'not urgent'],
};

export function triageFeedback(message: string): TriageResult {
  const lowerMessage = message.toLowerCase();

  // Detect category
  let detectedCategory: TriageResult['category'] = 'general';
  let maxCategoryScore = 0;

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = 0;
    for (const keyword of keywords) {
      if (lowerMessage.includes(keyword)) {
        score += keyword.split(' ').length;
      }
    }
    if (score > maxCategoryScore) {
      maxCategoryScore = score;
      detectedCategory = category as TriageResult['category'];
    }
  }

  // Detect priority
  let detectedPriority: TriageResult['priority'] = 'medium';

  for (const keyword of PRIORITY_KEYWORDS.critical || []) {
    if (lowerMessage.includes(keyword)) {
      detectedPriority = 'critical';
      break;
    }
  }
  if (detectedPriority === 'medium') {
    for (const keyword of PRIORITY_KEYWORDS.high || []) {
      if (lowerMessage.includes(keyword)) {
        detectedPriority = 'high';
        break;
      }
    }
  }
  if (detectedPriority === 'medium') {
    for (const keyword of PRIORITY_KEYWORDS.low || []) {
      if (lowerMessage.includes(keyword)) {
        detectedPriority = 'low';
        break;
      }
    }
  }

  // Security issues are always high+
  if (detectedCategory === 'security' && ['medium', 'low'].includes(detectedPriority)) {
    detectedPriority = 'high';
  }

  // Generate summary
  const summary = generateSummary(message, detectedCategory, detectedPriority);

  return {
    category: detectedCategory,
    priority: detectedPriority,
    aiSummary: summary,
  };
}

function generateSummary(message: string, category: string, priority: string): string {
  const categoryLabels: Record<string, string> = {
    bug: 'Bug Report',
    feature_request: 'Feature Request',
    security: 'Security Report',
    general: 'General Feedback',
  };

  // Take first sentence or first 100 chars
  const firstSentence = message.split(/[.!?]/)[0]?.trim() || message.substring(0, 100);
  const truncated = firstSentence.length > 100 ? firstSentence.substring(0, 97) + '...' : firstSentence;

  return `[${categoryLabels[category] || 'General'}] ${truncated}`;
}

// Auto-triage and update a feedback entry
export async function autoTriageFeedback(feedbackId: string, message: string) {
  const result = triageFeedback(message);

  try {
    await db
      .update(feedback)
      .set({
        category: result.category,
        priority: result.priority,
        aiSummary: result.aiSummary,
      })
      .where(eq(feedback.id, feedbackId));

    return result;
  } catch (error) {
    console.error('[ai:feedback] Failed to auto-triage:', error);
    return result;
  }
}
