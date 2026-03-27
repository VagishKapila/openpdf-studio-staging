import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  Brain, Shield, MessageSquare, Bell, TrendingUp,
  AlertCircle, CheckCircle2, AlertTriangle, ChevronRight, Loader,
} from 'lucide-react';
import {
  PieChart, Pie, BarChart, Bar, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/dashboard/KPICard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { CardSkeleton, TableSkeleton } from '@/components/shared/LoadingSkeleton';
import { ErrorState } from '@/components/shared/ErrorState';
import { useAIPatterns, useReminders } from '@/lib/hooks';

// Mock data for risk scans (would come from API)
const mockRiskScans = [
  {
    id: 'risk_1',
    documentName: 'NDA_Q1_2026.pdf',
    riskLevel: 'danger',
    score: 8.5,
    flagCount: 5,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'risk_2',
    documentName: 'Service_Agreement.pdf',
    riskLevel: 'warning',
    score: 6.2,
    flagCount: 3,
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'risk_3',
    documentName: 'Employment_Contract.pdf',
    riskLevel: 'safe',
    score: 2.1,
    flagCount: 0,
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'risk_4',
    documentName: 'Liability_Waiver.pdf',
    riskLevel: 'warning',
    score: 5.8,
    flagCount: 2,
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  },
];

// Mock feedback data
const mockFeedbackStats = {
  totalTriaged: 247,
  byCategory: [
    { name: 'Bugs', value: 89, color: '#ef4444' },
    { name: 'Features', value: 103, color: '#f59e0b' },
    { name: 'Security', value: 32, color: '#dc2626' },
    { name: 'General', value: 23, color: '#3b82f6' },
  ],
  byPriority: [
    { name: 'Critical', value: 15, color: '#dc2626' },
    { name: 'High', value: 47, color: '#f97316' },
    { name: 'Medium', value: 128, color: '#eab308' },
    { name: 'Low', value: 57, color: '#6b7280' },
  ],
};

// Mock reminders data
const mockReminders = [
  {
    id: 'rem_1',
    requestId: 'req_101',
    recipientEmail: 'john@acme.com',
    type: 'auto',
    scheduledAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    channel: 'email',
  },
  {
    id: 'rem_2',
    requestId: 'req_102',
    recipientEmail: 'jane@acme.com',
    type: 'escalation',
    scheduledAt: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(),
    channel: 'email',
  },
  {
    id: 'rem_3',
    requestId: 'req_103',
    recipientEmail: 'bob@acme.com',
    type: 'auto',
    scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    channel: 'sms',
  },
  {
    id: 'rem_4',
    requestId: 'req_104',
    recipientEmail: 'alice@acme.com',
    type: 'manual',
    scheduledAt: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
    channel: 'email',
  },
];

function getRiskIcon(riskLevel: string) {
  switch (riskLevel) {
    case 'danger':
      return AlertCircle;
    case 'warning':
      return AlertTriangle;
    case 'safe':
      return CheckCircle2;
    default:
      return AlertCircle;
  }
}

function getRiskColor(riskLevel: string) {
  switch (riskLevel) {
    case 'danger':
      return 'text-red-600';
    case 'warning':
      return 'text-yellow-600';
    case 'safe':
      return 'text-green-600';
    default:
      return 'text-gray-600';
  }
}

function getConfidenceColor(confidence: number) {
  if (confidence >= 0.8) return 'bg-green-500';
  if (confidence >= 0.6) return 'bg-yellow-500';
  return 'bg-red-500';
}

export function AIPage() {
  const [expandedRisk, setExpandedRisk] = useState<string | null>(null);
  const { data: patternsData, isLoading: patternsLoading, isError: patternsError, refetch: refetchPatterns } = useAIPatterns();
  const { data: remindersData, isLoading: remindersLoading, isError: remindersError, refetch: refetchReminders } = useReminders();

  const patterns = patternsData?.data ?? [];
  const reminders = remindersData?.data ?? [];

  // Calculate reminder stats
  const sentToday = 12;
  const pending = 8;
  const escalated = 2;
  const successRate = 94.5;

  if (patternsLoading || remindersLoading) {
    return (
      <div>
        <PageHeader title="AI Intelligence" subtitle="Document patterns, risk analysis, feedback triage, and smart reminders" />
        <div className="space-y-6">
          <CardSkeleton count={4} />
          <TableSkeleton rows={6} cols={4} />
        </div>
      </div>
    );
  }

  if (patternsError || remindersError) {
    return (
      <div>
        <PageHeader title="AI Intelligence" />
        <ErrorState message="Failed to load AI data" onRetry={() => { refetchPatterns(); refetchReminders(); }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Intelligence"
        subtitle="Document patterns, risk analysis, feedback triage, and smart reminders"
        onRefresh={() => { refetchPatterns(); refetchReminders(); }}
      />

      {/* SECTION 1: Document Pattern Learning */}
      <section>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            Document Pattern Learning
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">AI-detected patterns across {patterns.length} document types</p>
        </div>

        {/* Patterns KPI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <KPICard label="Total Patterns" value={patterns.length} icon={Brain} />
          <KPICard label="High Confidence" value={patterns.filter(p => p.confidence >= 0.8).length} trend="up" change={12} changeLabel="vs week" />
          <KPICard label="Avg Frequency" value={Math.round(patterns.reduce((sum, p) => sum + p.frequency, 0) / patterns.length || 0)} />
          <KPICard label="Learning Rate" value={`${Math.round(patterns.length * 1.8)}%`} trend="up" change={5} changeLabel="improvement" />
        </div>

        {/* Patterns Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">Pattern Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">Frequency</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">Confidence</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">Last Seen</th>
                </tr>
              </thead>
              <tbody>
                {patterns.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500">No patterns found</td>
                  </tr>
                ) : (
                  patterns.slice(0, 6).map((pattern) => {
                    const lastSeen = formatDistanceToNow(new Date(pattern.lastSeenAt), { addSuffix: true });
                    return (
                      <tr key={pattern.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors">
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{pattern.name}</p>
                          <p className="text-xs text-gray-500 font-mono">{pattern.fingerprint.slice(0, 16)}...</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{pattern.frequency}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${getConfidenceColor(pattern.confidence)}`}
                                style={{ width: `${pattern.confidence * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                              {Math.round(pattern.confidence * 100)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{lastSeen}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* SECTION 2: Contract Risk Analysis */}
      <section>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-red-600" />
            Contract Risk Analysis
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">AI-powered risk scoring and flag detection</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Risk Distribution Pie Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Risk Level Distribution</h4>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Safe', value: 12, color: '#10b981' },
                    { name: 'Warning', value: 8, color: '#f59e0b' },
                    { name: 'Danger', value: 5, color: '#ef4444' },
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name} (${value})`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  <Cell fill="#10b981" />
                  <Cell fill="#f59e0b" />
                  <Cell fill="#ef4444" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Risk KPIs */}
          <div className="flex flex-col gap-4">
            <KPICard label="Safe Documents" value="12" icon={CheckCircle2} trend="up" change={3} />
            <KPICard label="Warning (Review)" value="8" icon={AlertTriangle} trend="down" change={-1} />
            <KPICard label="Danger (High Risk)" value="5" icon={AlertCircle} trend="up" change={2} />
          </div>
        </div>

        {/* Recent Risk Scans Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Recent Risk Scans</p>
          </div>
          <div className="space-y-1">
            {mockRiskScans.map((scan) => {
              const RiskIcon = getRiskIcon(scan.riskLevel);
              const timeAgo = formatDistanceToNow(new Date(scan.createdAt), { addSuffix: true });
              const isExpanded = expandedRisk === scan.id;
              return (
                <button
                  key={scan.id}
                  onClick={() => setExpandedRisk(isExpanded ? null : scan.id)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors border-b border-gray-100 dark:border-gray-700/50 last:border-0"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <RiskIcon className={`w-5 h-5 flex-shrink-0 ${getRiskColor(scan.riskLevel)}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{scan.documentName}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{timeAgo}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{scan.score.toFixed(1)}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{scan.flagCount} flags</p>
                      </div>
                      <StatusBadge status={scan.riskLevel} />
                      <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`} />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 3: Feedback Triage */}
      <section>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            Feedback Triage
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{mockFeedbackStats.totalTriaged} total AI-triaged feedback items</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Category Breakdown */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">By Category</h4>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart
                data={mockFeedbackStats.byCategory}
                margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 12 }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                <Tooltip cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {mockFeedbackStats.byCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Priority Distribution */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">By Priority</h4>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={mockFeedbackStats.byPriority}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name} (${value})`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {mockFeedbackStats.byPriority.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard label="Bugs Found" value={mockFeedbackStats.byCategory[0].value} icon={AlertCircle} />
          <KPICard label="Feature Requests" value={mockFeedbackStats.byCategory[1].value} icon={TrendingUp} />
          <KPICard label="Security Reports" value={mockFeedbackStats.byCategory[2].value} icon={Shield} />
          <KPICard label="Critical Items" value={mockFeedbackStats.byPriority[0].value} trend="down" change={-3} />
        </div>
      </section>

      {/* SECTION 4: Smart Reminders */}
      <section>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-600" />
            Smart Reminders
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Automated signing reminders with escalation</p>
        </div>

        {/* Reminder KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KPICard label="Sent Today" value={sentToday} icon={Bell} trend="up" change={2} />
          <KPICard label="Pending" value={pending} icon={AlertTriangle} trend="up" change={1} />
          <KPICard label="Escalated" value={escalated} icon={AlertCircle} />
          <KPICard label="Success Rate" value={`${successRate}%`} icon={CheckCircle2} trend="up" change={1.2} />
        </div>

        {/* Upcoming Reminders */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Upcoming Reminders (Next 10)</p>
          </div>
          <div className="space-y-1">
            {reminders.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-gray-500">
                <Bell className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                No scheduled reminders
              </div>
            ) : (
              reminders.slice(0, 10).map((reminder) => {
                const scheduledIn = formatDistanceToNow(new Date(reminder.scheduledAt), { addSuffix: false });
                return (
                  <div key={reminder.id} className="px-4 py-3 border-b border-gray-100 dark:border-gray-700/50 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{reminder.recipientEmail}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium">
                            {reminder.channel === 'sms' ? 'SMS' : 'Email'}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">in {scheduledIn}</span>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        {reminder.type === 'escalation' ? (
                          <AlertTriangle className="w-4 h-4 text-yellow-600" title="Escalation" />
                        ) : reminder.type === 'manual' ? (
                          <MessageSquare className="w-4 h-4 text-blue-600" title="Manual" />
                        ) : (
                          <Loader className="w-4 h-4 text-gray-400" title="Auto" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
