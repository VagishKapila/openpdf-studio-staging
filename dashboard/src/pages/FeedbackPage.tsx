import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Bug, Lightbulb, MessageCircle, ShieldAlert, Sparkles, ChevronRight } from 'lucide-react';
import { useFeedback } from '@/lib/hooks';
import { Pagination } from '@/components/shared/Pagination';
import { FilterSelect } from '@/components/shared/FilterSelect';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PageHeader } from '@/components/shared/PageHeader';
import { TableSkeleton } from '@/components/shared/LoadingSkeleton';
import { ErrorState } from '@/components/shared/ErrorState';
import type { Feedback } from '@/types';

const CATEGORY_OPTIONS = [
  { value: 'bug', label: 'Bug' },
  { value: 'feature_request', label: 'Feature Request' },
  { value: 'general', label: 'General' },
  { value: 'security', label: 'Security' },
];

const PRIORITY_OPTIONS = [
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'acknowledged', label: 'Acknowledged' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

const categoryIcons: Record<string, { icon: typeof Bug; color: string; bg: string }> = {
  bug: { icon: Bug, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
  feature_request: { icon: Lightbulb, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  general: { icon: MessageCircle, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  security: { icon: ShieldAlert, color: 'text-red-700', bg: 'bg-red-50 dark:bg-red-900/20' },
};

export function FeedbackPage() {
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const limit = 25;

  const { data, isLoading, isError, error, refetch } = useFeedback({ page, limit, category, priority });

  const items = data?.data ?? [];
  const meta = data?.meta;

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Feedback" subtitle="AI-triaged client feedback pipeline" />
        <TableSkeleton rows={10} cols={4} />
      </div>
    );
  }

  if (isError) {
    return (
      <div>
        <PageHeader title="Feedback" />
        <ErrorState message={(error as any)?.message} onRetry={() => refetch()} />
      </div>
    );
  }

  // Priority summary counts
  const criticalCount = items.filter((f) => f.priority === 'critical').length;
  const highCount = items.filter((f) => f.priority === 'high').length;

  return (
    <div>
      <PageHeader
        title="Feedback"
        subtitle={`${meta?.total ?? 0} items · ${criticalCount} critical · ${highCount} high priority`}
        onRefresh={() => refetch()}
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <FilterSelect value={category} onChange={(v) => { setCategory(v); setPage(1); }} options={CATEGORY_OPTIONS} placeholder="All categories" />
        <FilterSelect value={priority} onChange={(v) => { setPriority(v); setPage(1); }} options={PRIORITY_OPTIONS} placeholder="All priorities" />
      </div>

      {/* Feedback Cards */}
      <div className="space-y-2">
        {items.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
            <p className="text-gray-400 text-sm">No feedback found.</p>
          </div>
        ) : (
          items.map((fb) => (
            <FeedbackCard key={fb.id} item={fb} isExpanded={expanded === fb.id} onToggle={() => setExpanded(expanded === fb.id ? null : fb.id)} />
          ))
        )}
      </div>

      {meta && meta.totalPages > 1 && (
        <Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={limit} onPageChange={setPage} />
      )}
    </div>
  );
}

function FeedbackCard({ item, isExpanded, onToggle }: { item: Feedback; isExpanded: boolean; onToggle: () => void }) {
  const catInfo = categoryIcons[item.category] ?? categoryIcons['general']!;
  const Icon = catInfo.icon;
  const timeAgo = formatDistanceToNow(new Date(item.createdAt), { addSuffix: true });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <button onClick={onToggle} className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors">
        <div className={`p-2 rounded-lg flex-shrink-0 ${catInfo.bg}`}>
          <Icon className={`w-4 h-4 ${catInfo.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-900 dark:text-white line-clamp-1">{item.message}</p>
          <div className="flex items-center gap-2 mt-1">
            <StatusBadge status={item.priority} />
            <StatusBadge status={item.status} />
            <span className="text-xs text-gray-400">{timeAgo}</span>
          </div>
        </div>
        <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`} />
      </button>

      {/* Expanded Detail */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-0 border-t border-gray-100 dark:border-gray-700/50">
          <div className="mt-3 space-y-3">
            {/* Full Message */}
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Full Message</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{item.message}</p>
            </div>

            {/* AI Summary */}
            {item.aiSummary && (
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                  <span className="text-xs font-semibold text-purple-700 dark:text-purple-400">AI Summary</span>
                </div>
                <p className="text-sm text-purple-900 dark:text-purple-300">{item.aiSummary}</p>
              </div>
            )}

            {/* Metadata */}
            <div className="flex flex-wrap gap-4 text-xs text-gray-500">
              <span>ID: <span className="font-mono">{item.id.slice(0, 8)}</span></span>
              <span>Org: <span className="font-mono">{item.orgId.slice(0, 8)}</span></span>
              <span>User: <span className="font-mono">{item.userId.slice(0, 8)}</span></span>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              {STATUS_OPTIONS.filter((s) => s.value !== item.status).slice(0, 3).map((s) => (
                <button
                  key={s.value}
                  className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/50 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  Mark {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
