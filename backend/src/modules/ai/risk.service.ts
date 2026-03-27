// Risk keywords and patterns for contract analysis
interface RiskFlag {
  category: string;
  severity: 'red' | 'yellow' | 'green';
  keyword: string;
  explanation: string;
  position?: number;
}

const RISK_PATTERNS: Array<{
  pattern: RegExp;
  category: string;
  severity: 'red' | 'yellow';
  explanation: string;
}> = [
  // Red flags — high risk
  { pattern: /unlimited liability/gi, category: 'liability', severity: 'red', explanation: 'Unlimited liability clause detected — may expose you to disproportionate risk' },
  { pattern: /indemnif(?:y|ication)\s+(?:and\s+)?hold\s+harmless/gi, category: 'indemnification', severity: 'red', explanation: 'Broad indemnification clause — review scope carefully' },
  { pattern: /non[- ]?compete/gi, category: 'non-compete', severity: 'red', explanation: 'Non-compete clause — may restrict future business activities' },
  { pattern: /automatic(?:ally)?\s+renew/gi, category: 'auto-renewal', severity: 'red', explanation: 'Auto-renewal clause — contract renews without explicit consent' },
  { pattern: /waive[s]?\s+(?:any|all)\s+(?:right|claim)/gi, category: 'waiver', severity: 'red', explanation: 'Broad rights waiver — you may be giving up important legal protections' },
  { pattern: /binding\s+arbitration/gi, category: 'arbitration', severity: 'red', explanation: 'Mandatory binding arbitration — you waive right to court proceedings' },
  { pattern: /personal\s+guarantee/gi, category: 'guarantee', severity: 'red', explanation: 'Personal guarantee required — personal assets may be at risk' },

  // Yellow flags — medium risk
  { pattern: /termination\s+(?:for\s+)?convenience/gi, category: 'termination', severity: 'yellow', explanation: 'Termination for convenience clause — other party can end contract without cause' },
  { pattern: /liquidated\s+damages/gi, category: 'damages', severity: 'yellow', explanation: 'Liquidated damages clause — pre-set penalty amounts' },
  { pattern: /force\s+majeure/gi, category: 'force-majeure', severity: 'yellow', explanation: 'Force majeure clause — review what events are covered' },
  { pattern: /intellectual\s+property\s+(?:rights?\s+)?(?:shall\s+)?(?:be\s+)?(?:assign|transfer|belong)/gi, category: 'ip-transfer', severity: 'yellow', explanation: 'IP transfer clause — review what intellectual property is being transferred' },
  { pattern: /confidential(?:ity)?\s+(?:agreement|clause|obligation)/gi, category: 'confidentiality', severity: 'yellow', explanation: 'Confidentiality obligations — review scope and duration' },
  { pattern: /limitation\s+of\s+liability/gi, category: 'liability-cap', severity: 'yellow', explanation: 'Liability limitation — verify the cap amount is reasonable' },
  { pattern: /governing\s+law|jurisdiction/gi, category: 'jurisdiction', severity: 'yellow', explanation: 'Governing law clause — verify jurisdiction is acceptable' },
  { pattern: /penalty|penalt(?:y|ies)\s+(?:for|of)/gi, category: 'penalties', severity: 'yellow', explanation: 'Penalty clause detected — review amounts and triggers' },
  { pattern: /(?:30|60|90|180)\s+days?\s+(?:notice|written\s+notice)/gi, category: 'notice-period', severity: 'yellow', explanation: 'Notice period requirement — ensure timeline is manageable' },
];

export function analyzeContractRisk(textContent: string): {
  overallRisk: 'red' | 'yellow' | 'green';
  score: number;
  flags: RiskFlag[];
  summary: string;
} {
  const flags: RiskFlag[] = [];

  for (const { pattern, category, severity, explanation } of RISK_PATTERNS) {
    const matches = textContent.matchAll(pattern);
    for (const match of matches) {
      flags.push({
        category,
        severity,
        keyword: match[0],
        explanation,
        position: match.index,
      });
    }
  }

  // Calculate risk score
  const redCount = flags.filter(f => f.severity === 'red').length;
  const yellowCount = flags.filter(f => f.severity === 'yellow').length;

  // Score: 0 = safe, 100 = very risky
  const score = Math.min(100, redCount * 20 + yellowCount * 8);

  const overallRisk: 'red' | 'yellow' | 'green' =
    redCount >= 2 || score >= 60 ? 'red' :
    redCount >= 1 || yellowCount >= 3 || score >= 30 ? 'yellow' :
    'green';

  const summary =
    overallRisk === 'green'
      ? `No significant risk flags detected. ${yellowCount > 0 ? `${yellowCount} minor items to review.` : 'Document appears straightforward.'}`
      : overallRisk === 'yellow'
      ? `${redCount + yellowCount} items flagged for review. ${redCount > 0 ? `${redCount} high-risk clause(s) require attention.` : 'Review yellow-flagged items before signing.'}`
      : `${redCount} high-risk clauses detected along with ${yellowCount} additional items. Careful legal review strongly recommended before signing.`;

  // Deduplicate by category (keep highest severity)
  const deduped = new Map<string, RiskFlag>();
  for (const flag of flags) {
    const existing = deduped.get(flag.category);
    if (!existing || (flag.severity === 'red' && existing.severity !== 'red')) {
      deduped.set(flag.category, flag);
    }
  }

  return {
    overallRisk,
    score,
    flags: Array.from(deduped.values()),
    summary,
  };
}
