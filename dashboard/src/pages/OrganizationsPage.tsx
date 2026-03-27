import { useState } from 'react';
import { format } from 'date-fns';
import { Building2, Globe, Palette, ExternalLink, Plus } from 'lucide-react';
import { useOrganizations, useDashboardStats } from '@/lib/hooks';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { Pagination } from '@/components/shared/Pagination';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PageHeader } from '@/components/shared/PageHeader';
import { TableSkeleton, CardSkeleton } from '@/components/shared/LoadingSkeleton';
import { ErrorState } from '@/components/shared/ErrorState';
import type { Organization } from '@/types';

export function OrganizationsPage() {
  const [page, setPage] = useState(1);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const limit = 25;

  const { data, isLoading, isError, error, refetch } = useOrganizations({ page, limit });
  const { data: statsData } = useDashboardStats();

  const orgs = data?.data ?? [];
  const meta = data?.meta;
  const stats = statsData?.data;

  const columns: Column<Organization>[] = [
    {
      key: 'name',
      header: 'Organization',
      render: (org) => (
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-white font-bold text-sm"
            style={{ backgroundColor: org.primaryColor || '#6366F1' }}
          >
            {org.logoUrl ? (
              <img src={org.logoUrl} alt="" className="w-9 h-9 rounded-lg object-cover" />
            ) : (
              org.name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{org.name}</p>
            <p className="text-xs text-gray-400">/{org.slug}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'plan',
      header: 'Plan',
      sortable: true,
      render: (org) => <StatusBadge status={org.plan} />,
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (org) => <StatusBadge status={org.isActive ? 'active' : 'inactive'} dot />,
    },
    {
      key: 'customDomain',
      header: 'Domain',
      render: (org) => org.customDomain ? (
        <div className="flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400">
          <Globe className="w-3 h-3" />
          <span>{org.customDomain}</span>
        </div>
      ) : <span className="text-xs text-gray-300">—</span>,
    },
    {
      key: 'primaryColor',
      header: 'Brand',
      render: (org) => (
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-full border border-gray-200 dark:border-gray-600" style={{ backgroundColor: org.primaryColor }} />
          <span className="w-4 h-4 rounded-full border border-gray-200 dark:border-gray-600" style={{ backgroundColor: org.secondaryColor }} />
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      render: (org) => <span className="text-sm text-gray-500">{format(new Date(org.createdAt), 'MMM d, yyyy')}</span>,
    },
  ];

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Organizations" subtitle="White-label client tenants" />
        <CardSkeleton count={3} />
        <div className="mt-6"><TableSkeleton rows={8} cols={6} /></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div>
        <PageHeader title="Organizations" />
        <ErrorState message={(error as any)?.message} onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Organizations"
        subtitle={`${meta?.total ?? 0} tenants · ${stats?.activeOrganizations ?? 0} active`}
        onRefresh={() => refetch()}
        actions={
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 transition-colors">
            <Plus className="w-3.5 h-3.5" /> New Org
          </button>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <SummaryCard icon={Building2} label="Total Orgs" value={meta?.total ?? 0} />
        <SummaryCard icon={Building2} label="Active" value={stats?.activeOrganizations ?? 0} accent="green" />
        <SummaryCard icon={Palette} label="Custom Domains" value={orgs.filter((o) => o.customDomain).length} accent="purple" />
      </div>

      <DataTable<Organization> columns={columns} data={orgs} keyField="id" onRowClick={(o) => setSelectedOrg(o)} />

      {meta && meta.totalPages > 1 && (
        <Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={limit} onPageChange={setPage} />
      )}

      {selectedOrg && <OrgDrawer org={selectedOrg} onClose={() => setSelectedOrg(null)} />}
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, accent }: { icon: typeof Building2; label: string; value: number; accent?: string }) {
  const colors = accent === 'green'
    ? 'bg-green-50 dark:bg-green-900/20 text-green-600'
    : accent === 'purple'
    ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600'
    : 'bg-brand-50 dark:bg-brand-900/20 text-brand-600';
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 flex items-center gap-4">
      <div className={`p-2.5 rounded-lg ${colors}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  );
}

function OrgDrawer({ org, onClose }: { org: Organization; onClose: () => void }) {
  return (
    <>
      <div className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-white dark:bg-gray-800 shadow-xl z-50 overflow-y-auto">
        <div className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                style={{ backgroundColor: org.primaryColor }}
              >
                {org.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{org.name}</h3>
                <p className="text-sm text-gray-500">/{org.slug}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl p-1">&times;</button>
          </div>

          {/* Brand Preview */}
          <div className="rounded-xl overflow-hidden mb-6 border border-gray-200 dark:border-gray-700">
            <div className="h-16 flex items-center px-4 gap-3" style={{ background: `linear-gradient(135deg, ${org.primaryColor}, ${org.secondaryColor})` }}>
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">{org.name.charAt(0)}</span>
              </div>
              <span className="text-white font-semibold text-sm">{org.name}</span>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 p-4">
              <p className="text-xs text-gray-400 mb-1">Brand colors</p>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded" style={{ backgroundColor: org.primaryColor }} />
                  <span className="text-xs font-mono text-gray-500">{org.primaryColor}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded" style={{ backgroundColor: org.secondaryColor }} />
                  <span className="text-xs font-mono text-gray-500">{org.secondaryColor}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-3">
            <DetailRow label="Org ID" value={<span className="font-mono text-xs">{org.id}</span>} />
            <DetailRow label="Plan" value={<StatusBadge status={org.plan} size="md" />} />
            <DetailRow label="Status" value={<StatusBadge status={org.isActive ? 'active' : 'inactive'} dot />} />
            <DetailRow label="Custom Domain" value={org.customDomain || '—'} />
            <DetailRow label="Email From" value={org.emailFromName || '—'} />
            <DetailRow label="Footer Text" value={org.footerText || '—'} />
            <DetailRow label="Stripe Customer" value={org.stripeCustomerId ? <span className="font-mono text-xs">{org.stripeCustomerId}</span> : '—'} />
            <DetailRow label="Created" value={format(new Date(org.createdAt), 'MMM d, yyyy h:mm a')} />
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
            <button className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <ExternalLink className="w-4 h-4" /> Open Client Dashboard
            </button>
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
