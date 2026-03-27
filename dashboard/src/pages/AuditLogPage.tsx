import { useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import {
  LogIn, LogOut, UserPlus, FileText, CreditCard, Settings, Shield, AlertTriangle,
  type LucideIcon,
} from 'lucide-react';
import { useAuditLog } from '@/lib/hooks';
import { Pagination } from '@/components/shared/Pagination';
import { FilterSelect } from '@/components/shared/FilterSelect';
import { SearchInput } from '@/components/shared/SearchInput';
import { PageHeader } from '@/components/shared/PageHeader';
import { TableSkeleton } from '@/components/shared/LoadingSkeleton';
import { ErrorState } from '@/components/shared/ErrorState';
import type { AuditLogEntry } from '@/types';

const ACTION_OPTIONS = [
  { value: 'login', label: 'Login' },
  { value: 'logout', label: 'Logout' },
  { value: 'register', label: 'Register' },
  { value: 'document.create', label: 'Document Created' },
  { value: 'document.sign', label: 'Document Signed' },
  { value: 'payment.create', label: 'Payment Created' },
  { value: 'payment.success', label: 'Payment Success' },
  { value: 'settings.update', label: 'Settings Updated' },
  { value: 'user.suspend', label: 'User Suspended' },
];

const actionIconMap: Record<string, { icon: LucideIcon; color: string; bg: string }> = {
  login: { icon: LogIn, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
  logout: { icon: LogOut, color: 'text-gray-500', bg: 'bg-gray-100 dark:bg-gray-700/50' },
  register: { icon: UserPlus, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  'document.create': { icon: FileText, color: 'text-brand-600', bg: 'bg-brand-50 dark:bg-brand-900/20' },
  'document.sign': { icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  'payment.create': { icon: CreditCard, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  'payment.success': { icon: CreditCard, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
  'settings.update': { icon: Settings, color: 'text-gray-600', bg: 'bg-gray-100 dark:bg-gray-700/50' },
  'user.suspend': { icon: Shield, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
};

const defaultActionIcon = { icon: AlertTriangle, color: 'text-gray-500', bg: 'bg-gray-100 dark:bg-gray-700/50' };

export function AuditLogPage() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [userIdFilter, setUserIdFilter] = useState('');
  const limit = 50;

  const { data, isLoading, isError, error, refetch } = useAuditLog({
    page, limit, action: actionFilter, userId: userIdFilter,
  });

  const entries = data?.data ?? [];
  const meta = data?.meta;

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Audit Log" subtitle="Track all platform activity" />
        <TableSkeleton rows={15} cols={4} />
      </div>
    );
  }

  if (isError) {
    return (
      <div>
        <PageHeader title="Audit Log" />
        <ErrorState message={(error as any)?.message} onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Audit Log" subtitle={`${meta?.total.toLocaleString() ?? 0} events recorded`} onRefresh={() => refetch()} />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <FilterSelect value={actionFilter} onChange={(v) => { setActionFilter(v); setPage(1); }} options={ACTION_OPTIONS} placeholder="All actions" />
        <div className="w-full sm:w-64">
          <SearchInput value={userIdFilter} onChange={(v) => { setUserIdFilter(v); setPage(1); }} placeholder="Filter by user ID…" />
        </div>
      </div>

      {/* Timeline-Style Event List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {entries.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-400 text-sm">No audit events found.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
            {entries.map((entry) => (
              <AuditRow key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </div>

      {meta && meta.totalPages > 1 && (
        <Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={limit} onPageChange={setPage} />
      )}
    </div>
  );
}

function AuditRow({ entry }: { entry: AuditLogEntry }) {
  const { icon: Icon, color, bg } = actionIconMap[entry.action] || defaultActionIcon;
  const timeAgo = formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true });
  const fullTime = format(new Date(entry.createdAt), 'MMM d, yyyy h:mm:ss a');

  return (
    <div className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors">
      {/* Icon */}
      <div className={`p-2 rounded-lg flex-shrink-0 mt-0.5 ${bg}`}>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
            {entry.action.replace(/[._]/g, ' ')}
          </span>
          {entry.resourceType && (
            <span className="text-xs text-gray-400">
              on {entry.resourceType}
              {entry.resourceId && <span className="font-mono"> #{entry.resourceId.slice(0, 8)}</span>}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          {entry.userId && (
            <span className="text-xs text-gray-500 font-mono">{entry.userId.slice(0, 12)}…</span>
          )}
          {entry.ipAddress && (
            <span className="text-xs text-gray-400">{entry.ipAddress}</span>
          )}
        </div>
      </div>

      {/* Timestamp */}
      <div className="text-right flex-shrink-0">
        <p className="text-xs text-gray-400" title={fullTime}>{timeAgo}</p>
      </div>
    </div>
  );
}
