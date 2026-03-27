import { useState } from 'react';
import { format } from 'date-fns';
import { Shield, ShieldOff, Mail, ExternalLink } from 'lucide-react';
import { useUsers } from '@/lib/hooks';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { Pagination } from '@/components/shared/Pagination';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { SearchInput } from '@/components/shared/SearchInput';
import { FilterSelect } from '@/components/shared/FilterSelect';
import { PageHeader } from '@/components/shared/PageHeader';
import { TableSkeleton, CardSkeleton } from '@/components/shared/LoadingSkeleton';
import { ErrorState } from '@/components/shared/ErrorState';
import type { User } from '@/types';

const PLAN_OPTIONS = [
  { value: 'free', label: 'Free' },
  { value: 'starter', label: 'Starter' },
  { value: 'professional', label: 'Professional' },
  { value: 'enterprise', label: 'Enterprise' },
];

export function UsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const limit = 25;

  const { data, isLoading, isError, error, refetch } = useUsers({ page, limit, search });

  const users = data?.data ?? [];
  const meta = data?.meta;

  const filtered = planFilter ? users.filter((u) => u.plan === planFilter) : users;

  const columns: Column<User>[] = [
    {
      key: 'name',
      header: 'User',
      render: (u) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center flex-shrink-0">
            {u.avatar ? (
              <img src={u.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <span className="text-xs font-semibold text-brand-600 dark:text-brand-400">
                {(u.name || u.email).charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{u.name || '—'}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'plan',
      header: 'Plan',
      sortable: true,
      render: (u) => <StatusBadge status={u.plan} />,
    },
    {
      key: 'emailVerified',
      header: 'Status',
      render: (u) => (
        <div className="flex items-center gap-1.5">
          <StatusBadge status={u.emailVerified ? 'verified' : 'unverified'} dot />
          {u.isSuperAdmin && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded text-xs font-medium">
              <Shield className="w-3 h-3" /> Admin
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'googleId',
      header: 'Auth',
      render: (u) => (
        <span className="text-xs text-gray-500">{u.googleId ? 'Google' : 'Email'}</span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Joined',
      sortable: true,
      render: (u) => (
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {format(new Date(u.createdAt), 'MMM d, yyyy')}
        </span>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Users" subtitle="Manage all platform users" />
        <CardSkeleton count={3} />
        <div className="mt-6"><TableSkeleton rows={10} cols={5} /></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div>
        <PageHeader title="Users" />
        <ErrorState message={(error as any)?.message} onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Users" subtitle={`${meta?.total.toLocaleString() ?? 0} total users`} onRefresh={() => refetch()} />

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="w-full sm:w-72">
          <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search by email…" />
        </div>
        <FilterSelect value={planFilter} onChange={setPlanFilter} options={PLAN_OPTIONS} placeholder="All plans" />
      </div>

      <DataTable<User> columns={columns} data={filtered} keyField="id" onRowClick={(u) => setSelectedUser(u)} />

      {meta && meta.totalPages > 1 && (
        <Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={limit} onPageChange={setPage} />
      )}

      {selectedUser && <UserDrawer user={selectedUser} onClose={() => setSelectedUser(null)} />}
    </div>
  );
}

function UserDrawer({ user, onClose }: { user: User; onClose: () => void }) {
  return (
    <>
      <div className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white dark:bg-gray-800 shadow-xl z-50 overflow-y-auto animate-slide-in">
        <div className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                {user.avatar ? (
                  <img src={user.avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <span className="text-lg font-bold text-brand-600 dark:text-brand-400">
                    {(user.name || user.email).charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{user.name || 'No name'}</h3>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl leading-none p-1">&times;</button>
          </div>

          <div className="space-y-4">
            <DetailRow label="User ID" value={<span className="font-mono text-xs">{user.id}</span>} />
            <DetailRow label="Plan" value={<StatusBadge status={user.plan} size="md" />} />
            <DetailRow label="Email Verified" value={<StatusBadge status={user.emailVerified ? 'verified' : 'unverified'} dot />} />
            <DetailRow label="Auth Method" value={user.googleId ? 'Google OAuth' : 'Email / Password'} />
            <DetailRow label="Super Admin" value={user.isSuperAdmin ? 'Yes' : 'No'} />
            <DetailRow label="Joined" value={format(new Date(user.createdAt), 'MMM d, yyyy h:mm a')} />
            <DetailRow label="Last Updated" value={format(new Date(user.updatedAt), 'MMM d, yyyy h:mm a')} />
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700 space-y-2">
            <DrawerAction icon={Mail} label="Send Verification Email" />
            <DrawerAction icon={ExternalLink} label="View Activity Log" />
            <DrawerAction icon={ShieldOff} label="Suspend User" variant="danger" />
          </div>
        </div>
      </div>
    </>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-700/50 last:border-0">
      <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-sm text-gray-900 dark:text-white">{value}</span>
    </div>
  );
}

function DrawerAction({ icon: Icon, label, variant = 'default' }: { icon: typeof Mail; label: string; variant?: 'default' | 'danger' }) {
  const cls = variant === 'danger'
    ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30'
    : 'text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700';
  return (
    <button className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${cls}`}>
      <Icon className="w-4 h-4" /> {label}
    </button>
  );
}
